import { APIGatewayProxyEventV2 } from 'aws-lambda'
import { middyfy } from '../../lib/middy'
import { getTypes } from './type.store'
import { getByQuery } from '../../lib/routing'

export const types = middyfy(async (event: APIGatewayProxyEventV2) => {
  return getByQuery(event, resolveTypes)
})

async function resolveTypes(query: any) {
  const { startKey, limit } = query || {}
  const limitN = limit ? Number(limit) : undefined
  return getTypes(startKey, limitN)
}
