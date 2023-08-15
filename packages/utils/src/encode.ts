// Convenience functions to encode/decode strings, for ex request cursors

import { parse, stringify } from "./json"

export function encodeJsonToBase64(json: unknown) {
  const stringified = stringify(json)
  if (stringified) {
    return encodeBase64(stringified)
  }
}

export function encodeBase64(value: string) {
  return Buffer.from(value)?.toString('base64')
}

export function decodeBase64ToJson(value: string) {
  const decoded = decodeBase64(value)
  return parse(decoded)
}

export function decodeBase64(value: string) {
  return Buffer.from(value, 'base64')?.toString()
}
