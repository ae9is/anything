import { APIGatewayProxyEventQueryStringParameters, APIGatewayProxyEventV2 } from 'aws-lambda'
import { middyfy } from '../../lib/middy'
import { getTypes } from './type.store'
import { getByQuery, getPaginationParamsFromQuery } from '../../lib/routing'

export const types = middyfy(async (event: APIGatewayProxyEventV2) => {
  return getByQuery(event, resolveTypes)
})

async function resolveTypes(query?: APIGatewayProxyEventQueryStringParameters) {
  const { startKey, limit } = getPaginationParamsFromQuery(query)
  return getTypes(startKey, limit)
}
