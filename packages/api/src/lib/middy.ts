import middy from '@middy/core'
import jsonBodyParser from '@middy/http-json-body-parser'
import httpErrorHandler from '@middy/http-error-handler'
import validator from '@middy/validator'
import errorLogger from '@middy/error-logger'
import httpHeaderNormalizer from '@middy/http-header-normalizer'
import httpEventNormalizer from '@middy/http-event-normalizer'
import httpUrlEncodePathParser from '@middy/http-urlencode-path-parser'

// ref: https://middy.js.org/docs/events/api-gateway-http/
export function middyfy(handler: any, eventSchema: any = null) {
  if (eventSchema) {
    return middy()
      .use(errorLogger())
      .use(httpEventNormalizer())
      .use(httpHeaderNormalizer())
      .use(httpUrlEncodePathParser())
      .use(jsonBodyParser())
      .use(validator({ eventSchema }))
      .use(httpErrorHandler())
      .handler(handler)
  }
  return middy()
    .use(errorLogger())
    .use(httpEventNormalizer())
    .use(httpHeaderNormalizer())
    .use(httpUrlEncodePathParser())
    .use(jsonBodyParser())
    .use(httpErrorHandler())
    .handler(handler)
}
