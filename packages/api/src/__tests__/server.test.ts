import { it, describe, expect } from '@jest/globals'
import axios from 'axios'
import { StatusCodes } from 'http-status-codes'
import { LOCAL_API_HOST } from '../config'

describe('server', () => {
  it('health check returns 200', async () => {
    const check = await axios.get(`${LOCAL_API_HOST}/v1/healthz`)
    expect(check?.status).toBe(StatusCodes.OK)
  })
})
