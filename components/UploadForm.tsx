"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ImageIcon, Upload } from "lucide-react"

import FileUploadField from "@/components/FileUploadField"
import InputField from "@/components/InputField"
import LoadingOverlay from "@/components/LoadingOverlay"
import VoiceSelector from "@/components/VoiceSelector"
import { Form } from "@/components/ui/form"
import {
  ACCEPTED_IMAGE_TYPES,
  ACCEPTED_PDF_TYPES,
  DEFAULT_VOICE,
  voiceOptions,
} from "@/lib/constants"
import { UploadSchema } from "@/lib/zod"
import { BookUploadFormValues } from "@/types"
import { toast } from "sonner"
import {useUser} from "@clerk/nextjs";
import {useRouter} from "next/navigation";
import {checkBookExists, createBook, saveBookSegments} from "@/lib/actions/book.actions";
import {parsePDFFile} from "@/lib/utils";
import {upload} from "@vercel/blob/client";

const UploadForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useUser();
  const router = useRouter();

  const form = useForm<BookUploadFormValues>({
    resolver: zodResolver(UploadSchema),
    defaultValues: {
      title: "",
      author: "",
      persona: voiceOptions[DEFAULT_VOICE as keyof typeof voiceOptions].id,
    },
  })

  const onSubmit = async (data: BookUploadFormValues) => {
    if(!user?.id) {
      toast.error("Please login to upload books");
      return;
    }

    setIsSubmitting(true)

    // PostHog -> Track Book uploads

    try {
      const existsCheck = await checkBookExists(data.title);

      if (existsCheck.exists && existsCheck.book) {
        toast.info("Book with same title already exists!");
        form.reset();
        router.push(`/books/${existsCheck.book.slug}`);
        return;
      }

      const fileTitle = data.title.replace(/\s+/g, "-").toLowerCase();
      const pdfFile = data.pdfFile;

      const parsedPDF = await parsePDFFile(pdfFile);

      if(parsedPDF.content.length === 0) {
        toast.error("Failed to parse pdf. Please try again with a different file.");
        return;
      }

      const uploadedPdfBlob = await upload(fileTitle, pdfFile, {
        access: "public",
        handleUploadUrl: "/api/upload",
        contentType: "application/pdf",
      });

      let coverUrl: string;

      if(data.coverImage) {
        const coverFile = data.coverImage;
        const uploadedCoverBlob = await upload(`${fileTitle}_cover.png`, coverFile, {
          access: "public",
          handleUploadUrl: "/api/upload",
          contentType: coverFile.type,
        });
        coverUrl = uploadedCoverBlob.url;
      } else {
        const response = await fetch(parsedPDF.cover);
        const blob = await response.blob();

        const uploadedCoverBlob = await upload(`${fileTitle}_cover.png`, blob, {
          access: "public",
          handleUploadUrl: "/api/upload",
          contentType: "image/png",
        })

        coverUrl = uploadedCoverBlob.url;
      }

      const book = await createBook({
        clerkId: user?.id,
        title: data.title,
        author: data.author,
        persona: data.persona,
        fileURL: uploadedPdfBlob.url,
        fileBlobKey: uploadedPdfBlob.pathname,
        coverURL: coverUrl,
        fileSize: pdfFile.size,
      })

      if(!book.success) throw new Error("Failed to create book.");

      if (book.alreadyExists) {
        toast.info("Book with same title already exists!");
        form.reset();
        router.push(`/books/${book.data.slug}`);
        return;
      }

      const segments = await saveBookSegments(book.data._id, user?.id, parsedPDF.content);

      if(!segments.success){
        toast.error("Failed to save book segments.");
        throw new Error("Failed to save book segments.");
      }

      form.reset();
      router.push(`/books/${book.data.slug}`);
    } catch (error) {
      console.error(error);
      console.error("Book upload failed:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <LoadingOverlay isVisible={isSubmitting} title="Processing your book..." />

      <div className="new-book-wrapper">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-8"
          >
            <FileUploadField
              control={form.control}
              name="pdfFile"
              label="PDF File"
              acceptTypes={ACCEPTED_PDF_TYPES}
              disabled={isSubmitting}
              icon={Upload}
              placeholder="Click to upload PDF"
              hint="PDF file (max 50MB)"
            />

            <FileUploadField
              control={form.control}
              name="coverImage"
              label="Cover Image"
              acceptTypes={ACCEPTED_IMAGE_TYPES}
              disabled={isSubmitting}
              icon={ImageIcon}
              placeholder="Click to upload cover image"
              hint="Leave empty to auto-generate from PDF"
            />

            <InputField
              control={form.control}
              name="title"
              label="Title"
              placeholder="ex: Rich Dad Poor Dad"
              disabled={isSubmitting}
            />

            <InputField
              control={form.control}
              name="author"
              label="Author Name"
              placeholder="ex: Robert Kiyosaki"
              disabled={isSubmitting}
            />

            <VoiceSelector control={form.control} disabled={isSubmitting} />

            <button
              type="submit"
              className="form-btn"
              disabled={isSubmitting}
            >
              Begin Synthesis
            </button>
          </form>
        </Form>
      </div>
    </>
  )
}

export default UploadForm
