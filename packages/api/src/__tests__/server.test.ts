import axios from 'axios'
import { StatusCodes } from 'http-status-codes'

describe('server', () => {
  it('health check returns 200', async () => {
    const check = await axios.get('/healthz')
    expect(check).toBe(StatusCodes.OK)
  })
})
