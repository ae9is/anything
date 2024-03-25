import * as assert from 'assert'
import * as transformer from '../transformer'
import * as c from '../constants'

const csvFragment = '"ABC"|12345|22.589|"This is a the product description"'
// These should be identical, but with low-level DynamoDB types in marshalled fragment's Keys, NewImage, and OldImage
const jsonFragment = {Keys:{"key1":"value1","key2":"value2",},"key3":567}
const jsonFragmentString = '{Keys:{"key1":"value1","key2":"value2",},"key3":567}'
const marshalledJsonFragment = {Keys:{"key1":{"S":"value1"},"key2":{"S":"value2"},},"key3":567}
describe('Input Data Tests', function () {
  describe('Verify the transformer does not add escape sequence to strings with double quotes', function () {
    const record = jsonFragmentString
    transformer.addNewlineTransformer(record, function (err: string | null, data: any) {
      if (err) {
        assert.fail(err, undefined, 'Unexpected Error')
      } else {
        it('Does not add escape sequence', function () {
          assert.equal(data.toString(c.targetEncoding), record + '\n', ' The data got modified ')
        })
      }
    })
  })
  describe('Verify the transformer does not modify non JSON data', function () {
    const record = csvFragment
    transformer.addNewlineTransformer(record, function (err: string | null, data: any) {
      if (err) {
        assert.fail(err, undefined, 'Unexpected Error')
      } else {
        it('Verify that the CSV data is right', function () {
          assert.equal(
            data.toString(c.targetEncoding),
            record + '\n',
            ' The CSV data got modified'
          )
        })
      }
    })
  })
  describe('Verify the transformer unmarshalls DynamoDB typed data correctly', function () {
    const record = marshalledJsonFragment
    transformer.unmarshallDynamoDBTransformer(record, function (err: string | null, data: any) {
      if (err) {
        assert.fail(err, undefined, 'Unexpected Error')
      } else {
        it('Unmarshalls data correctly', function () {
          assert.equal(data.toString(c.targetEncoding), JSON.stringify(jsonFragment) + '\n', ' The data got modified ')
        })
      }
    })
  })
})
