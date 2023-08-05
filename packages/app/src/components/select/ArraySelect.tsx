// A select that simply takes an array of values (as opposed to an object with key value pairs
//  for option labels and values)

import ReactSelect, { ActionMeta, GroupBase, SingleValue, StylesConfig, Theme } from 'react-select'
import { join } from '../../lib/style'

export interface ArraySelectProps {
  options: string[]
  value?: string // Allows passing short code instead of full react-select OptionType
  id?: string
  onChange?: (newValue?: string) => void
  className?: string
}

type Option = {
  value: string
  label: string
}

// ref: https://stackoverflow.com/a/74143834
export function ArraySelect({
  onChange,
  id,
  className,
  options,
  value,
  ...props
}: ArraySelectProps) {
  const selectOptions: Option[] = options.map((value) => {
    return {
      value: value ?? '',
      label: value ?? '',
    }
  })

//  if (!value) {
//    value = options?.[0]
//    // If a default value is set, then it needs to be passed up
//    onChange?.(value)
//  }

  const selectedOption: Option = {
    value: value ?? '',
    label: value ?? '',
  }

  const handleChange = (newValue: SingleValue<Option>, meta: ActionMeta<Option>) => {
    onChange?.(newValue?.value ?? undefined)
  }

  // Restyle react-select to match daisyui elements
  // ref: https://stackoverflow.com/a/60912805
  // ref: https://react-select.com/home#custom-styles
  // ref: https://react-select.com/styles
  const customStyles: StylesConfig<Option, false, GroupBase<Option>> = {
    container: (styles) => ({
      ...styles,
    }),
    control: (styles, { isDisabled, isFocused }) => ({
      ...styles,
      //backgroundColor: 'hsl(var(--b1) / var(--tw-bg-opacity))',
      borderColor: 'hsl(var(--bc) / 0.2)', // .input-bordered { --tw-border-opacity: 0.2 }
      borderRadius: 'var(--rounded-btn, 0.5rem)',
      //boxShadow: isDisabled ? undefined : isFocused ? '0 0 0 2px hsl(var(--p))' : undefined,
      minHeight: '3rem',
      height: '3rem',
    }),
    valueContainer: (styles) => ({
      ...styles,
      height: '3rem',
    }),
    input: (styles) => ({
      ...styles,
      color: 'hsl(var(--bc))',
    }),
    indicatorSeparator: () => ({
      display: 'none',
    }),
    indicatorsContainer: (styles) => ({
      ...styles,
      height: '3rem',
    }),
    menuList: (styles) => ({
      ...styles,
      //backgroundColor: 'hsl(var(--b1))',
    }),
    option: (provided, { isDisabled, isFocused, isSelected }) => ({
      ...provided,
      //backgroundColor: isDisabled ? undefined : isFocused ? 'hsl(var(--pf))' : isSelected ? 'hsl(var(--p))' : undefined,
      color: isDisabled ? undefined : (isFocused || isSelected) ? 'hsl(var(--pc))' : undefined,
    }),
  }

  function customTheme(theme: Theme): Theme {
    return {
      ...theme,
      borderRadius: 8,
      colors: {
        ...theme.colors,
        primary: 'hsl(var(--p))', // Option focus background colour, input focus border colour
        primary75: 'hsl(var(--p) / 0.75)',
        primary50: 'hsl(var(--p) / 0.50)',
        primary25: 'hsl(var(--p) / 0.25)', // Option hover background colour
        neutral0: 'hsl(var(--b1))', // Background colour
        neutral80: 'hsl(var(--bc))', // Sets placeholder (label) font colour
        //neutral5: 'hsl(var(--b1) / 0.95)',
        //neutral10: 'hsl(var(--b1) / 0.9)',
        //neutral20: 'hsl(var(--b1) / 0.8)',
        //neutral30: 'hsl(var(--b1) / 0.7)',
        //neutral40: 'hsl(var(--b1) / 0.6)',
        //neutral50: 'hsl(var(--b1) / 0.5)',
        //neutral60: 'hsl(var(--b1) / 0.4)',
        //neutral70: 'hsl(var(--b1) / 0.3)',
        //neutral80: 'hsl(var(--b1) / 0.2)',
        //neutral90: 'hsl(var(--b1) / 0.1)',
        danger: 'hsl(var(--er))',
        dangerLight: 'hsl(var(--erc))',
      },
    }
  }

  return (
    <ReactSelect
      inputId={id}
      options={selectOptions}
      getOptionLabel={(opt: Option) => opt.label}
      getOptionValue={(opt: Option) => opt.value}
      value={selectedOption}
      onChange={handleChange}
      isSearchable
      //components={{
      //  // Hide dropdown indicator to match fontpicker
      //  IndicatorSeparator: () => null,
      //  DropdownIndicator: () => null,
      //}}
      className={join('h-12', className)}
      styles={customStyles}
      theme={customTheme}
      {...props}
    />
  )
}
