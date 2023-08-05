// prettier-ignore
'use client'

import { queries, useQuery } from '../../../data'

export default function Page() {
  const { data, error, isLoading } = useQuery(queries.listTypes)
  const types = data?.items ?? []
  //const lastKey = data?.lastKey
  let list
  if (error) {
    list = <p>Error fetching types!</p>
  } else if (isLoading) {
    list = <p>Loading</p>
  } else {
    list = (
      <ul>
        {types.map((typeInfo: any, idx: number) => (
          <li key={idx + typeInfo?.type}>{typeInfo?.type}</li>
        ))}
      </ul>
    )
  }

  return (
    <>
      <h1>Types</h1>
      {list}
    </>
  )
}
