// A text input without using Formik

import { Input } from './Input'

export interface TextInputProps {
  id: string
  label?: string
  altLabel?: string
  placeholder?: string
  defaultValue?: string
  onChange?: (value: string) => void
  rest?: any
}

export function TextInput({
  id,
  label,
  altLabel,
  placeholder = 'Type here',
  defaultValue,
  onChange,
  ...rest
}: TextInputProps) {
  function handleChange(event: any) {
    const newValue = event?.target?.value ?? undefined
    onChange?.(newValue)
  }

  return (
    <div className="form-control w-full max-w-xs">
      {(label || altLabel) && (
        <label htmlFor={id} className="label">
          <span className="label-text">{label}</span>
          <span className="label-text-alt">{altLabel}</span>
        </label>
      )}
      <Input
        id={id}
        type="text"
        placeholder={placeholder}
        className="input input-bordered w-full max-w-xs"
        defaultValue={defaultValue}
        onChange={handleChange}
        {...rest}
      />
    </div>
  )
}
