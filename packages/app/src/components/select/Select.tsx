import { useState } from 'react'
import ReactSelect, { ActionMeta, SingleValue } from 'react-select'
import { join } from '../../lib/style'

export interface SelectProps {
  options: Record<string, string>
  defaultValue?: string // Allows passing short code instead of full react-select OptionType
  id?: string
  onChange?: (newValue: string) => void
  className?: string
}

type Option = {
  value: string
  label: string
}

interface ArrayObjectSelectState {
  selectedOption: Option | null
}

// ref: https://stackoverflow.com/a/74143834
export function Select({
  onChange,
  id,
  className,
  options,
  defaultValue = Object.keys(options)?.[0],
  ...props
}: SelectProps) {
  let defaultLabel
  if (Object.prototype.hasOwnProperty.call(options, defaultValue)) {
    defaultLabel = options[defaultValue][0]
  }
  const selectOptions: Option[] = Object.entries(options).map(([key, value]) => {
    return {
      value: key ?? '',
      label: value[0] ?? '',
    }
  })

  const defaultOption: Option = {
    value: defaultValue ?? '',
    label: defaultLabel ?? '',
  }

  const [state, setState] = useState<ArrayObjectSelectState>({
    selectedOption: defaultOption,
  })

  const handleChange = (newValue: SingleValue<Option>, meta: ActionMeta<Option>) => {
    if (newValue !== null) {
      setState({ selectedOption: newValue })
      onChange?.(newValue.value)
    }
  }

  return (
    <ReactSelect
      inputId={id}
      options={selectOptions}
      getOptionLabel={(opt: Option) => opt.label}
      getOptionValue={(opt: Option) => opt.value}
      value={state.selectedOption}
      onChange={handleChange}
      isSearchable
      components={{
        // Hide dropdown indicator to match fontpicker
        //IndicatorSeparator: () => null,
        //DropdownIndicator: () => null,
      }}
      className={join("h-12", className)}
      {...props}
    />
  )
}
