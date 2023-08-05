import * as XLSX from 'xlsx'
import logger from 'logger'

const jsonExtensions = ['json']

// Parse as spreadsheet or JSON text based on extension
export async function getJsonArrayDataFromFile(file: File): Promise<[any[], number]> {
  let errorCount = 0
  const isJsonFile = jsonExtensions.some((ext: string) => {
    return file?.name?.toLowerCase().endsWith(ext)
  })
  if (isJsonFile) {
    let json: any[] = []
    try {
      const text = await file.text()
      json = JSON.parse(text)
    } catch (e) {
      ++errorCount
      logger.error(`Error processing file ${file} as JSON`)
    }
    return [json, errorCount]
  }
  return getJsonArrayDataFromSpreadsheetFile(file)
}

export async function getJsonArrayDataFromSpreadsheetFile(file: File): Promise<[any[], number]> {
  let jsonArray: any[] = []
  let errorCount = 0
  try {
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer)
    let sheetNum = 0
    const totalNum = workbook.Sheets?.length ?? 0
    for (const [sheetName, sheet] of Object.entries(workbook.Sheets)) {
      sheetNum++
      logger.debug(`Processing sheet ${sheetName} in ${file?.name} (${sheetNum} / ${totalNum})`)
      try {
        // ref: https://docs.sheetjs.com/docs/api/utilities/array/#array-output
        const sheetJsonArray = XLSX.utils.sheet_to_json(sheet, {
          blankrows: false,
        })
        jsonArray = [...jsonArray, ...sheetJsonArray]
      } catch (sheetErr) {
        ++errorCount
        logger.error(`Error processing sheet ${sheetName} in ${file?.name} (${sheetNum} / ${totalNum})`)
        logger.error(sheetErr)
      }
    }
  } catch (workbookErr) {
    ++errorCount
    logger.error(`Error processing spreadsheet file ${file}`)
    logger.error(workbookErr)
  }
  return [jsonArray, errorCount]
}
