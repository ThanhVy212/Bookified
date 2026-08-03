'use server';

import {CreateBook, TextSegment} from "@/types";
import {connectToDatabase} from "@/database/mongoose";
import {generateSlug, serializeData} from "@/lib/utils";
import Book from "@/database/models/book.model";
import BookSegment from "@/database/models/book-segment.model";
import { deleteUploadedBlobs } from "@/lib/actions/blob.actions";

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
            error: e
        }
    }
}

export const checkBookExists = async (title: string) => {
    try {
        await connectToDatabase();

        const slug = generateSlug(title);

        const existingBook = await Book.findOne({ slug }).lean();

        if (!existingBook) {
            return { exists: false };
        }

        return {
            exists: true,
            book: serializeData(existingBook),
            isComplete: existingBook.totalSegments > 0,
        };
    } catch (e) {
        console.error('Error in checkBookExists', e);
        return {
            exists: false,
            error: e,
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
                if (staleBlobUrls.length > 0) {
                    await deleteUploadedBlobs(staleBlobUrls);
                }

                const updatedBook = await Book.findByIdAndUpdate(
                    existingBook._id,
                    { ...data, slug },
                    { new: true },
                );

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

        return {
            success: true,
            data: serializeData(book),
        }
    } catch (e) {
        console.error('Error creating Book', e);

        return {
            success: false,
            error: e,
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
            error: e,
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
        console.log('Deleted book segments, book, and uploaded blobs due to failure to save segments.')
        return {
            success: false,
            error: e,
        }
    }
}

