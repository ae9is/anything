import { APIGatewayProxyEventV2 } from 'aws-lambda'
import { middyfy } from '../../lib/middy'
import { getByQuery } from '../../lib/routing'

export const healthz = middyfy(async (event: APIGatewayProxyEventV2) => {
  return getByQuery(event, resolveHealthz)
})

async function resolveHealthz() {
  return true
}
