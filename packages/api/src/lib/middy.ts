import middy from '@middy/core'
import jsonBodyParser from '@middy/http-json-body-parser'
import httpErrorHandler from '@middy/http-error-handler'
import validator from '@middy/validator'

export function middyfy(handler: any, eventSchema: any = null) {
  if (eventSchema) {
    return middy()
      .use(jsonBodyParser())
      .use(validator({ eventSchema }))
      .use(httpErrorHandler())
      .handler(handler)
  }
  return middy().use(jsonBodyParser()).use(httpErrorHandler()).handler(handler)
}
