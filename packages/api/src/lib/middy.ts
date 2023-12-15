import middy from '@middy/core'
import httpJsonBodyParser from '@middy/http-json-body-parser'
import httpErrorHandler from '@middy/http-error-handler'
import validator from '@middy/validator'
import errorLogger from '@middy/error-logger'
import httpHeaderNormalizer from '@middy/http-header-normalizer'
import httpEventNormalizer from '@middy/http-event-normalizer'
import httpUrlEncodePathParser from '@middy/http-urlencode-path-parser'

// ref: https://middy.js.org/docs/events/api-gateway-rest/

export function middyfy(handler: any) {
  return middy()
    .use(errorLogger())
    .use(httpEventNormalizer())
    .use(httpHeaderNormalizer())
    .use(httpUrlEncodePathParser())
    .use(httpErrorHandler())
    .handler(handler)
}

// Body parser now fails and throws Unsupported Media Type when Content-Type header is null
export function middyfyWithBody(handler: any, eventSchema: any = null) {
  if (eventSchema) {
    return middy()
      .use(errorLogger())
      .use(httpEventNormalizer())
      .use(httpHeaderNormalizer())
      .use(httpUrlEncodePathParser())
      .use(httpJsonBodyParser())
      .use(validator({ eventSchema }))
      .use(httpErrorHandler())
      .handler(handler)
  }
  return middy()
    .use(errorLogger())
    .use(httpEventNormalizer())
    .use(httpHeaderNormalizer())
    .use(httpUrlEncodePathParser())
    .use(httpJsonBodyParser())
    .use(httpErrorHandler())
    .handler(handler)
}
