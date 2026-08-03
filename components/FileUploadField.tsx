"use client"

import { useRef } from "react"
import { X } from "lucide-react"

import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form"
import { cn } from "@/lib/utils"
import { FileUploadFieldProps } from "@/type"

import { FieldValues } from "react-hook-form"

function FileUploadField<T extends FieldValues>({
  control,
  name,
  label,
  acceptTypes,
  disabled,
  icon: Icon,
  placeholder,
  hint,
}: FileUploadFieldProps<T>) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <FormField
      control={control}
      name={name}
      render={({ field: { onChange, value, ...field } }) => {
        const file = value as File | undefined

        const handleFileChange = (selectedFile: File | undefined) => {
          onChange(selectedFile)
        }

        return (
          <FormItem>
            <label className="form-label">{label}</label>
            <FormControl>
              <div>
                <input
                  ref={inputRef}
                  name={field.name}
                  onBlur={field.onBlur}
                  type="file"
                  accept={acceptTypes.join(",")}
                  disabled={disabled}
                  className="hidden"
                  onChange={(event) => {
                    const selectedFile = event.target.files?.[0]
                    handleFileChange(selectedFile)
                  }}
                />
                <div
                  role="button"
                  tabIndex={disabled ? -1 : 0}
                  onClick={() => !disabled && inputRef.current?.click()}
                  onKeyDown={(event) => {
                    if (
                      !disabled &&
                      (event.key === "Enter" || event.key === " ")
                    ) {
                      event.preventDefault()
                      inputRef.current?.click()
                    }
                  }}
                  className={cn(
                    "upload-dropzone border border-dashed border-[#c4b498]",
                    file && "upload-dropzone-uploaded"
                  )}
                >
                  {file ? (
                    <div className="flex items-center gap-3 px-4">
                      <p className="upload-dropzone-text">{file.name}</p>
                      <button
                        type="button"
                        className="upload-dropzone-remove"
                        disabled={disabled}
                        onClick={(event) => {
                          event.stopPropagation()
                          handleFileChange(undefined)
                          if (inputRef.current) {
                            inputRef.current.value = ""
                          }
                        }}
                        aria-label="Remove file"
                      >
                        <X className="size-5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <Icon className="upload-dropzone-icon" />
                      <p className="upload-dropzone-text">{placeholder}</p>
                      <p className="upload-dropzone-hint">{hint}</p>
                    </>
                  )}
                </div>
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )
      }}
    />
  )
}

export default FileUploadField
