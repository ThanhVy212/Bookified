'use server';

import {CreateBook, TextSegment} from "@/types";
import {connectToDatabase} from "@/database/mongoose";
import {escapeRegex, generateSlug, serializeData} from "@/lib/utils";
import Book from "@/database/models/book.model";
import BookSegment from "@/database/models/book-segment.model";
import { deleteUploadedBlobs } from "@/lib/actions/blob.actions";
import mongoose from "mongoose";
import {useAuth} from "@clerk/nextjs";
import {revalidatePath} from "next/cache";

export const getAllBooks = async () => {
    try {
        await connectToDatabase();

        const books = await Book.find({}).sort({ createdAt: -1 }).lean();

        return {
         success: true,
         data: serializeData(books),
        }
    } catch (e) {
        console.error("Error getting all books." ,e);
        return {
            success: false,
            error: "Error getting all books."
        }
    }
}

export const getBookBySlug = async (slug: string) => {
    try {
        await connectToDatabase();

        const book = await Book.findOne({ slug }).lean();

        if (!book) {
            return { success: false, error: 'Book not found' };
        }

        return {
            success: true,
            data: serializeData(book)
        }
    } catch (e) {
        console.error('Error fetching book by slug', e);
        return {
            success: false, error: 'Error fetching book by slug'
        }
    }
}

export const checkBookExists = async (title: string) => {
    try {
        await connectToDatabase();

        const slug = generateSlug(title);
        const userId = useAuth();

        const existingBook = await Book.findOne({ slug }).lean();

        if (!existingBook) {
            return { exists: false };
        }

        const isOwner = existingBook.clerkId === userId;
        return {
            exists: true,
            isOwner,
            book: isOwner ? serializeData(existingBook) : null,
            isComplete: existingBook.totalSegments > 0,
        };
    } catch (e) {
        console.error('Error in checkBookExists', e);
        return {
            exists: false,
            error: 'Error in checkBookExists',
        }
    }
}

export const createBook = async (data: CreateBook) => {
    try {
        await connectToDatabase();

        const slug = generateSlug(data.title);

        const existingBook = await Book.findOne({ slug }).lean();

        if (existingBook) {
            if (existingBook.totalSegments > 0) {
                return {
                    success: true,
                    data: serializeData(existingBook),
                    alreadyExists: true,
                    isComplete: true,
                };
            }

            if (existingBook.clerkId === data.clerkId) {
                const staleBlobUrls = [existingBook.fileURL, existingBook.coverURL].filter(Boolean);

                const updatedBook = await Book.findByIdAndUpdate(
                    existingBook._id,
                    { ...data, slug },
                    { new: true },
                );

                const obsoleteUrls = staleBlobUrls.filter(
                    (url) => url !== data.fileURL && url !== data.coverURL,
                );
                if (obsoleteUrls.length > 0) {
                    await deleteUploadedBlobs(obsoleteUrls);
                }

                return {
                    success: true,
                    data: serializeData(updatedBook),
                };
            }

            return {
                success: true,
                data: serializeData(existingBook),
                alreadyExists: true,
                isComplete: false,
            };
        }

        // Todo: check subscription limits before creating a book

        const book = await Book.create({...data, slug, totalSegments: 0});

        revalidatePath('/');

        return {
            success: true,
            data: serializeData(book),
        }
    } catch (e) {
        console.error('Error creating Book', e);

        return {
            success: false,
            error: 'Error creating Book',
        }
    }
}

export const deleteBookById = async (bookId: string) => {
    try {
        await connectToDatabase();

        await BookSegment.deleteMany({ bookId });
        await Book.findByIdAndDelete(bookId);

        return { success: true };
    } catch (e) {
        console.error('Error deleting book', e);
        return {
            success: false,
            error: 'Error deleting book',
        };
    }
};

export const saveBookSegments = async (
    bookId: string,
    clerkId: string,
    segments: TextSegment[],
    blobUrls: string[] = [],
) => {
    try {
        await connectToDatabase();
        console.log('Saving book segments ...');

        const existingCount = await BookSegment.countDocuments({ bookId });

        if (existingCount === segments.length) {
            return {
                success: true,
                data: { segmentsCreated: segments.length },
            };
        }

        if (existingCount > 0) {
            await BookSegment.deleteMany({ bookId });
        }

        const segmentsToInsert = segments.map(({ text, segmentIndex, pageNumber, wordCount }) => ({
            clerkId, bookId, content: text, segmentIndex, pageNumber, wordCount
        }));

        await BookSegment.insertMany(segmentsToInsert);

        await Book.findByIdAndUpdate(bookId, { totalSegments: segments.length });

        console.log('Book segments saved successfully.');

        return {
            success: true,
            data: { segmentsCreated: segments.length }
        }
    } catch (e) {
        console.error('Error saving book segments', e);

        await BookSegment.deleteMany({ bookId });
        await Book.findByIdAndDelete(bookId);
        await deleteUploadedBlobs(blobUrls);
        console.error('Deleted book segments, book, and uploaded blobs due to failure to save segments.', e)
        return {
            success: false,
            error: 'Deleted book segments, book, and uploaded blobs due to failure to save segments.',
        }
    }
}

// Searches book segments using MongoDB text search with regex fallback
export const searchBookSegments = async (bookId: string, query: string, limit: number = 5) => {
    try {
        await connectToDatabase();

        console.log(`Searching for: "${query}" in book ${bookId}`);

        const bookObjectId = new mongoose.Types.ObjectId(bookId);

        // Try MongoDB text search first (requires text index)
        let segments: Record<string, unknown>[] = [];
        try {
            segments = await BookSegment.find({
                bookId: bookObjectId,
                $text: { $search: query },
            })
                .select('_id bookId content segmentIndex pageNumber wordCount')
                .sort({ score: { $meta: 'textScore' } })
                .limit(limit)
                .lean();
        } catch {
            // Text index may not exist — fall through to regex fallback
            segments = [];
        }

        // Fallback: regex search matching ANY keyword
        if (segments.length === 0) {
            const keywords = query.split(/\s+/).filter((k) => k.length > 2);

            if (keywords.length === 0) {
               return { success: true, data: [] };
            }

            const pattern = keywords.map(escapeRegex).join('|');

            segments = await BookSegment.find({
                bookId: bookObjectId,
                content: { $regex: pattern, $options: 'i' },
            })
                .select('_id bookId content segmentIndex pageNumber wordCount')
                .sort({ segmentIndex: 1 })
                .limit(limit)
                .lean();
        }

        console.log(`Search complete. Found ${segments.length} results`);

        return {
            success: true,
            data: serializeData(segments),
        };
    } catch (error) {
        console.error('Error searching segments:', error);
        return {
            success: false,
            error: (error as Error).message,
            data: [],
        };
    }
};