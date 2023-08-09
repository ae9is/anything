// prettier-ignore
'use client'

import { useRef, useState } from 'react'
import logger from 'logger'
import { getJsonArrayDataFromFile } from '../../../lib/spreadsheet'
import { NewTabLink } from '../../../components'
import { queries, requestQuery } from '../../../data'
import { chunkArray } from 'utils'
import { lambdaPayloadLimit } from '../../../config'
import { join } from '../../../lib/style'

export default function Page() {
  const [processedCount, setProcessedCount] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [errorCount, setErrorCount] = useState(0)
  const abortController = new AbortController()
  const abort = abortController?.signal?.aborted ?? false
  const [draggingOver, setDraggingOver] = useState(false)
  const dragCounter = useRef<number>(0)

  async function handleDrop(event: React.DragEvent) {
    event.stopPropagation()
    event.preventDefault()
    // To reset drag over UI changes after dropping:
    //dragCounter.current = 0
    // Process dropped file and then import to database
    let fileNum = 0
    const fileCount = event?.dataTransfer?.files?.length ?? 0
    setTotalCount((val) => val + fileCount)
    for (const file of event?.dataTransfer?.files) {
      if (abort) return
      fileNum++
      logger.debug(`Processing file ${fileNum} of ${fileCount}`)
      const [jsonArray, parseErrorCount] = await getJsonArrayDataFromFile(file)
      // Split up json array into chunks based on max payload size and send the chunks in separate requests
      const chunks = chunkArray(jsonArray, lambdaPayloadLimit)
      logger.debug(`Chunked file into ${chunks?.length || 0} requests`)
      let apiErrorCount = 0
      for (const json of chunks) {
        if (abort) return
        try {
          const res = await requestQuery(queries.postBatchItems, {
            body: json,
          })
          if (json.length !== res?.itemCount) {
            logger.error(`Sent ${json.length} items and ${res?.itemCount} passed validation`)
            throw Error('Some items failed')
          }
        } catch (e) {
          ++apiErrorCount
        }
      }
      if (abort) return
      const fileErrorCount = parseErrorCount + apiErrorCount
      setProcessedCount((val) => val + 1)
      setErrorCount((val) => val + fileErrorCount)
    }
  }

  // Needed to specify valid drop target
  // ref: https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API/Drag_operations#specifying_drop_targets
  // ref: https://stackoverflow.com/a/50233827
  async function handleDragOver(event: React.DragEvent) {
    event.preventDefault()
  }

  async function handleCancel() {
    logger.log(
      'Cancelling data import after next file (already imported files will not be deleted)...'
    )
    abortController.abort()
  }

  async function handleDragEnter(event: React.DragEvent) {
    // Count drag enter/leave events so that child drag leave events can be ignored
    // ref: https://stackoverflow.com/a/21002544
    event.preventDefault()
    dragCounter.current++
    if (dragCounter.current > 0) {
      setDraggingOver(true)
    }
  }

  async function handleDragLeave(event: React.DragEvent) {
    dragCounter.current--
    if (dragCounter.current <= 0) {
      dragCounter.current = 0
      setDraggingOver(false)
    }
  }

  // Add or remove highlight on dragging a file over drop area
  const backgroundColor = draggingOver ? 'bg-primary/20' : 'bg-none'
  const borderWidth = draggingOver ? 'border-4' : 'border-2'

  return (
    <>
      <h1>Import</h1>
      <p>Batch import data from an array of items in a spreadsheet or a JSON formatted file:</p>
      <ul>
        <li>Spreadsheets must contain one item per row with an <code>id</code> column defined for every entry.</li>
        <li>JSON formatted files must contain an array of objects with at least the <code>id</code> key defined, for ex:<code>{`[{id:'id1', ...}, {id: 'id2', ...}, ...]`}</code></li>
        <li>
          JSON files must end in .json, all other file extensions will be treated as spreadsheets.{' '}
          <NewTabLink href="https://docs.sheetjs.com/docs/miscellany/formats/">
            For a list of supported spreadsheet formats see here.
          </NewTabLink>
        </li>
      </ul>
      <div
        id="dropZone"
        className={join(
          "my-12 border-dashed border-primary rounded-box h-48 min-h-full text-center justify-center items-center p-4 flex flex-col",
          backgroundColor,
          borderWidth,
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
      >
        {!totalCount && <div className={"text-primary text-xl"}>Drop here to import</div>}
        {totalCount > 0 && (totalCount !== processedCount) && (
          <>
            <div className="mb-4">
              Processing {processedCount} of {totalCount} ...
            </div>
            <button className="btn" type="button" onClick={handleCancel}>
              Cancel
            </button>
          </>
        )}
        {totalCount > 0 && totalCount === processedCount && (
          <>
            <div>{totalCount} file{totalCount > 1 ? 's' : ''} processed</div>
            {errorCount > 0 && (
              <div className="tooltip" data-tip="Check console logs for error details">
                <div className="text-error">{errorCount} error{errorCount > 1 ? 's' : ''}</div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}
