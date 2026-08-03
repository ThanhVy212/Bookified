"use client"

import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { InputFieldProps } from "@/types"

import { FieldValues } from "react-hook-form"

function InputField<T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  disabled,
}: InputFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <label className="form-label" htmlFor={field.name}>
            {label}
          </label>
          <FormControl>
            <Input
              {...field}
              id={field.name}
              disabled={disabled}
              placeholder={placeholder}
              className="form-input"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

export default InputField
