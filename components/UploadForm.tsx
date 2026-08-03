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
import { BookUploadFormValues } from "@/type"

const UploadForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<BookUploadFormValues>({
    resolver: zodResolver(UploadSchema),
    defaultValues: {
      title: "",
      author: "",
      persona: voiceOptions[DEFAULT_VOICE as keyof typeof voiceOptions].id,
    },
  })

  const onSubmit = async (values: BookUploadFormValues) => {
    setIsSubmitting(true)

    try {
      const formData = new FormData()
      formData.append("title", values.title)
      formData.append("author", values.author)
      formData.append("persona", values.persona)
      formData.append("pdfFile", values.pdfFile)
      if (values.coverImage) {
        formData.append("coverImage", values.coverImage)
      }

      const response = await fetch("/api/books", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Failed to upload book")
      }
    } catch (error) {
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
