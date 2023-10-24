import { StatusCodes } from 'http-status-codes'
import { send } from './response'
import { APIGatewayProxyEventQueryStringParameters, APIGatewayProxyEventV2 } from 'aws-lambda'

export async function getByQuery(
  event: APIGatewayProxyEventV2,
  resolver: (query: APIGatewayProxyEventQueryStringParameters) => Promise<any>
) {
  const query = event?.queryStringParameters ?? {}
  const data = await resolver(query)
  return send(data)
}

export async function getById(
  event: APIGatewayProxyEventV2,
  resolver: (id: string) => Promise<any>
) {
  const id = event?.pathParameters?.id
  if (!id) {
    return send('Request missing id', StatusCodes.BAD_REQUEST)
  }
  const data = await resolver(id)
  return send(data)
}

export async function getByIdAndQuery(
  event: APIGatewayProxyEventV2,
  resolver: (id: string, query?: APIGatewayProxyEventQueryStringParameters) => Promise<any>
) {
  const id = event?.pathParameters?.id
  const query = event?.queryStringParameters
  if (!id) {
    return send('Request must contain id and optionally query', StatusCodes.BAD_REQUEST)
  }
  const data = await resolver(id, query)
  return send(data)
}

export async function changeById(
  event: APIGatewayProxyEventV2,
  resolver: (id: string, body: any) => Promise<any>
) {
  const id = event?.pathParameters?.id
  const body = event?.body
  if (!id || !body) {
    return send('Request must contain id and body', StatusCodes.BAD_REQUEST)
  }
  const data = await resolver(id, body)
  const statusCode = data ? StatusCodes.OK : StatusCodes.BAD_REQUEST
  return send(data, statusCode)
}

export async function changeBatch(
  event: APIGatewayProxyEventV2,
  resolver: (body: string) => Promise<any>
) {
  const body = event?.body
  if (!body) {
    return send('Request must body', StatusCodes.BAD_REQUEST)
  }
  const data = await resolver(body)
  return send(data)
}

export async function deleteById(
  event: APIGatewayProxyEventV2,
  resolver: (id: string) => Promise<boolean>
) {
  const id = event?.pathParameters?.id
  if (!id) {
    return send('Request missing id', StatusCodes.BAD_REQUEST)
  }
  const isDeleted = await resolver(id)
  if (isDeleted) {
    return send({})
  }
  return send(`Failed to delete ${id}`, StatusCodes.INTERNAL_SERVER_ERROR)
}

export function getPaginationParamsFromQuery(query?: APIGatewayProxyEventQueryStringParameters) {
  const startKey = query?.startKey
  const limit: number | undefined = Number(query?.limit) || undefined // No NaN, 0
  const asc: boolean | undefined = (query?.asc !== 'false') // Default to true, ascending sort
  return { startKey, limit, asc }
}