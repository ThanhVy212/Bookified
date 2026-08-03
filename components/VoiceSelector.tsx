"use client"

import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form"
import { cn } from "@/lib/utils"
import { voiceCategories, voiceOptions } from "@/lib/constants"
import { BookUploadFormValues } from "@/type"
import { Control } from "react-hook-form"

interface VoiceSelectorFieldProps {
  control: Control<BookUploadFormValues>
  disabled?: boolean
  className?: string
}

const categoryLabels = {
  male: "Male Voices",
  female: "Female Voices",
} as const

function VoiceSelector({
  control,
  disabled,
  className,
}: VoiceSelectorFieldProps) {
  return (
    <FormField
      control={control}
      name="persona"
      render={({ field }) => (
        <FormItem className={className}>
          <label className="form-label">Choose Assistant Voice</label>
          <FormControl>
            <div className="space-y-6">
              {(Object.keys(voiceCategories) as Array<keyof typeof voiceCategories>).map(
                (category) => (
                  <div key={category} className="space-y-3">
                    <p className="text-base font-medium text-[#3d485e]">
                      {categoryLabels[category]}
                    </p>
                    <div className="voice-selector-options">
                      {voiceCategories[category].map((voiceKey) => {
                        const voice =
                          voiceOptions[voiceKey as keyof typeof voiceOptions]
                        const isSelected = field.value === voice.id

                        return (
                          <button
                            key={voiceKey}
                            type="button"
                            disabled={disabled}
                            onClick={() => field.onChange(voice.id)}
                            className={cn(
                              "voice-selector-option",
                              isSelected
                                ? "voice-selector-option-selected"
                                : "voice-selector-option-default",
                              disabled && "voice-selector-option-disabled"
                            )}
                          >
                            <div className="flex flex-col items-center gap-1 text-center">
                              <span className="text-base font-semibold text-[#212a3b]">
                                {voice.name}
                              </span>
                              <span className="text-sm text-[#777] leading-snug">
                                {voice.description}
                              </span>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              )}
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

export default VoiceSelector
