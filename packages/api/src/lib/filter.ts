// Filter string for getting lists of things.
// Similar to: https://google.aip.dev/160
// Ex:
//  /items?filter=...

// NOTE a lot of complexity in filter expression language.
// Probably best to just stick with something close to dynamodb request format. (KeyConditionExpression, FilterExpression)

import { CustomError } from './error'

export function parseFilterString(filter: string) {
  return [null, null]
}

export class FilterParseError extends CustomError {
  constructor(message: any) {
    super(message)
    this.name = 'FilterParseError'
  }
}
