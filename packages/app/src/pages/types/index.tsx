import { queries, useQuery } from '../../data'
import { withLayout } from '../../components/layout/withLayout'
import { withAuth } from '../../components/auth/withAuth'

export default withLayout(function Page() {
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
          <li key={idx + typeInfo?.id}>{typeInfo?.id}</li>
        ))}
      </ul>
    )
  }

  return withAuth(
    <>
      <h1>Types</h1>
      {list}
    </>
  )
})
