import * as assert from 'assert'

import * as transform from '../transformer'
import * as c from '../constants'

describe('Transformer Tests', function () {
  beforeEach(function () {
    delete process.env[c.STREAM_DATATYPE_ENV]
    delete process.env[c.TRANSFORMER_FUNCTION_ENV]
  })
  describe('- Verify the default transformer', function () {
    it(': Is using the default transformer', function () {
      transform.setupTransformer(async function (err: string | null, t: any) {
        if (err) {
          assert.fail(err)
        } else {
          assert.equal(
            t.name,
            'bound ' + c.transformerRegistry.jsonToStringTransformer,
            ' Transformer Incorrectly Set '
          )
        }
      })
    })
  })
  describe('- Verify configuring the stream datatype CSV', function () {
    it(': Is using the configured transformer', function () {
      process.env[c.STREAM_DATATYPE_ENV] = 'CSV'
      transform.setupTransformer(async function (err: string | null, t: any) {
        if (err) {
          assert.fail(err)
        } else {
          assert.equal(
            t.name,
            'bound ' + c.transformerRegistry.addNewlineTransformer,
            ' Transformer Incorrectly Set '
          )
        }
      })
    })
  })
  describe('- Verify configuring the stream datatype CSV with newlines', function () {
    it(': Is using the configured transformer', function () {
      process.env[c.STREAM_DATATYPE_ENV] = 'CSV-WITH-NEWLINES'
      transform.setupTransformer(async function (err: string | null, t: any) {
        if (err) {
          assert.fail(err)
        } else {
          assert.equal(
            t.name,
            'bound ' + c.transformerRegistry.doNothingTransformer,
            ' Transformer Incorrectly Set '
          )
        }
      })
    })
  })
  describe('- Verify configuring the stream datatype BINARY', function () {
    it(': Is using the configured transformer', function () {
      process.env[c.STREAM_DATATYPE_ENV] = 'BINARY'
      transform.setupTransformer(async function (err: string | null, t: any) {
        if (err) {
          assert.fail(err)
        } else {
          assert.equal(
            t.name,
            'bound ' + c.transformerRegistry.doNothingTransformer,
            ' Transformer Incorrectly Set '
          )
        }
      })
    })
  })
})
