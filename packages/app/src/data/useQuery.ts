// prettier-ignore
'use client'

import useSWR, { mutate } from 'swr'
import { QueryParameterBag, RequestProps, request } from '../lib/request'
import { Query } from './queries'
import useSWRMutation from 'swr/mutation'
import logger from 'logger'

export interface QueryOptions {
  id?: string
  body?: any
  queryParams?: QueryParameterBag
}

export function useQuery(query: Query, options?: QueryOptions) {
  const key = getRequestKeyFromQuery(query, options)
  logger.debug('Using query with key: ', key)
  // ref: https://swr.vercel.app/docs/arguments#passing-objects
  return useSWR(key, (key) => requester(key))
}

// Use fallback query if no query id passed for first query.
//  Just a workaround to avoid conditional use of hooks.
export function useConditionalQuery(
  query: Query, queryOpts: QueryOptions,
  fallback: Query, fallbackOpts: QueryOptions,
) {
  let chosen
  let chosenOpts
  if (queryOpts?.id) {
    logger.debug('Using query with options: ', queryOpts)
    chosen = query
    chosenOpts = queryOpts
  } else {
    logger.debug('Using fallback query with options', fallbackOpts)
    chosen = fallback
    chosenOpts = fallbackOpts
  }
  return useQuery(chosen, chosenOpts)
}

// Mutation is triggered on user interaction via trigger().
// Note that we can't trigger(newValue) because trigger doesn't play nice with how our requests are setup.
// [Keys are objects to avoid unnecessary invalidation of entire chains of queries; trigger(arg) 
//   only modifies request(key, { arg }) in useSWRMutation(key, request), and key is untouched.]
// ref: https://swr.vercel.app/docs/mutation#basic-usage
export function useMutation(query: Query, options?: QueryOptions) {
  const key = getRequestKeyFromQuery(query, options)
  // ref: https://swr.vercel.app/docs/mutation#useswrmutation
  return useSWRMutation(key, (key) => requester(key), {
    populateCache: false, // default for useSWRMutation
  })
}

// For directly calling API update without hook.
// Can also use with bound mutate for reactivity, or just useMutation above
// ref: https://swr.vercel.app/docs/mutation#bound-mutate
export async function requestQuery(query: Query, options?: QueryOptions) {
  const key = getRequestKeyFromQuery(query, options)
  return requester(key)
}

// Trigger revalidation for queries with relevant keys.
// Needed if a mutation indirectly affects queries.
export function invalidate(query: Query, options?: QueryOptions) {
  const key = getRequestKeyFromQuery(query, options)
  mutate(key)
}

function getRequestKeyFromQuery(query: Query, options?: QueryOptions) {
  const { id, body, queryParams } = options ?? {}
  const key = {
    method: query.method,
    path: query.path(id ?? ''),
    body,
    queryParams,
  }
  return key
}

type RequesterProps = Omit<RequestProps, 'version'>

export async function requester(props: RequesterProps) {
  const response = await request(props)
  // ref: https://github.com/axios/axios#response-schema
  const { data, status, statusText } = response
  if (status && (status < 200 || status >= 300)) {
    // useSWR expects fetcher to throw errors
    // ref: https://swr.vercel.app/docs/error-handling
    const error = new SWRError('Error with request', status, statusText)
    throw error
  }
  return data ?? {}
}

class SWRError extends Error {
  status: number
  info?: string

  constructor(msg: string, status: number, info?: string) {
    super(msg)
    this.status = status
    this.info = info
  }
}
