// prettier-ignore
'use client'

import { queries } from '../../data'
import { LoadingSelect } from './LoadingSelect'

export interface TypeSelectProps {
  value?: string
  onChange?: (newValue?: string) => void
}

export function TypeSelect({
  value,
  onChange,
}: TypeSelectProps) {
  const queryResultMapper = (typeInfo: any) => typeInfo?.type

  return (
    <LoadingSelect
      query={queries.listTypes}
      queryResultMapper={queryResultMapper}
      value={value}
      onChange={onChange}
    />
  )
}
