import * as assert from 'assert'

import * as router from '../router'
import { BatchItem } from '../handler'

describe('Routing tests', function () {
  const defaultDeliveryStream = 'MyDeliveryStream'
  describe('Default Routing', function () {
    const records = [
      Buffer.from('IanTest1').toString('base64'),
      Buffer.from('IanTest2').toString('base64'),
    ]
    router.routeToDestination(
      defaultDeliveryStream,
      records,
      router.defaultRouting.bind(undefined),
      function (err: string | null, data: any) {
        if (err) {
          assert.equal(err, undefined, 'Unexpected Error')
        } else {
          // check the record count
          it('Returns the correct number of records', function () {
            let totalRecords = 0
            Object.keys(data).map(function (key) {
              data[key].map(function (item: BatchItem) {
                totalRecords += 1
              })
            })
            assert.equal(totalRecords, 2, 'Correct Record Count')
          })
          // check that we only get back the default delivery stream
          it('Returns a single destination', function () {
            const keyLen = Object.keys(data).length
            if (keyLen > 1) {
              assert.equal(keyLen, 1, 'Unexpected number of delivery streams')
            }
          })
          it('Returns the correct delivery stream', function () {
            // check the delivery stream name
            Object.keys(data).map(function (key) {
              assert.equal(key, defaultDeliveryStream, 'Unexpected destination')
            })
          })
        }
      }
    )
  })
})
