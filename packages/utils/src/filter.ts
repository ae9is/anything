import logger from 'logger'

// DynamoDB expressions to search for and filter items.
//
// Key condition expressions are the most efficient way to query items.
//
// Filter expressions filter already retrieved items using DynamoDB.
//  Still consumes read units but still more efficient than passing back to server.

export interface Filter {
  // Sort key part of key condition expression for items
  // Key condition expression is: '#type = :type' + (' ') + sortKeyExpression
  sortKeyExpression?: string

  // ex: "contains(Color, :c) and Price <= :p"
  // ref: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Expressions.OperatorsAndFunctions.html
  filterExpression?: string

  // Placeholder for attribute name, i.e. { "#c": "Comment" }. Number sign (#) is mandatory.
  // Needed since DynamoDB has reserved words, and dots and hyphens are also reserved.
  // ref: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Expressions.ExpressionAttributeNames.html
  attributeNames?: Record<string, string>

  // Needed to compare an attribute to a value. ex: { ":c": { "Black" }, ":p": { 500 } }. Colon (:) is mandatory.
  // DynamoDB document client takes care of converting javascript types to keys i.e. { "Black" } => { "S": "Black" }.
  // ref: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Expressions.ExpressionAttributeValues.html
  attributeValues?: Record<string, any>

  // Could also add projection expressions i.e. specify which attributes are retrieved
  // ref: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Expressions.ProjectionExpressions.html
}

const keywords = [
  'between',
  'and',
  'in',
  'or',
  'not',
  '=',
  '<>',
  '<',
  '<=',
  '>',
  '>=',
  'attribute_exists',
  'attribute_not_exists',
  'attribute_type',
  'begins_with',
  'contains',
  'size',
  '(',
  ')',
  ',',
]

/*
  Search string / filter implementation notes:

  - The goal is that the user should just be able to specify the attribute names and values directly,
  and the client should just take care of mapping those to attribute names and/or values
  and constructing expressions using those attribute name and/or value mappings.

  - We split search string into tokens by whitespace, parenthese, and commas, keeping the delimiters.
  For tokens that are attribute names or values, a key instead of the token is inserted into the constructed filter expression.

  - There is ambiguity with nested attributes vs attributes with '.' in the name. For this app, we disallow 
  attributes with '.' in the name and assume all dots imply nested attributes in the DynamoDB table.
  (Alternatively, since @ is already reserved we could let the user use @ for nested attributes, but this isn't as clear
  from a user POV).

  - Attribute values can be strings, so in order to be able to separate them from attribute names we require 
  attribute values that are strings to be quoted (either single or double). Numeric attribute values should be unquoted.

  - For now, search strings limited to current item (v0 sort key) retrieval

  - User search string should use real names of DynamoDB table attributes, and whatever string/number 
  constants to compare to as needed.

  - Attribute names are detected as tokens that aren't in the keywords list
*/

export const defaultFilter: Filter = Object.freeze({
  sortKeyExpression: '#sort = :sort',
  filterExpression: undefined,
  attributeNames: { '#sort': 'sort' },
  attributeValues: { ':sort': 'v0' },
})

// Example values
//  filter string: 'contains(Color, "Black") and Price <= 500'
//  filter expression: "contains(#color, :c) and Price <= :p"
//  attributeNames: { "#c": "Color" }
//  attributeValues: { ":c": { "Black" }, ":p": { 500 } }
export function parseSearchString(filterString?: string): Filter | undefined {
  logger.debug('Parsing search string: ', filterString)
  let filter: Filter | undefined = undefined
  let filterExpression = defaultFilter.filterExpression ?? ''
  const sortKeyExpression = defaultFilter.sortKeyExpression ?? ''
  // Deep copy to prevent overwriting default filter attributes
  const attributeNames = structuredClone(defaultFilter.attributeNames) ?? {}
  const attributeValues = structuredClone(defaultFilter.attributeValues) ?? {}
  if (!filterString || filterString.trim().length === 0) {
    logger.debug('Empty search string passed, return default filter: ', defaultFilter)
    return defaultFilter
  }
  try {
    // Split into tokens by whitespace, parentheses, and commas, keeping the delimiters
    const sepRegex = /([(),\s]+)/g
    let tokens = filterString?.trim().split(sepRegex)
    if (tokens[tokens.length - 1] === '') {
      // Chop off last empty value from regex split that occurs if we end on a separator
      tokens = tokens.slice(0, tokens.length - 1)
    }
    let tokenIdx = 0
    let valueIdx = 0
    tokens.forEach((token: string) => {
      tokenIdx++
      const isSep = token.match(sepRegex)
      // Reserved keywords aren't attribute names or values
      const isReserved = keywords.includes(token.toLowerCase())
      if (isSep || isReserved) {
        filterExpression += token
      } else {
        // Determine attribute value if:
        // - Number (parse number success)
        // - Quoted string
        // - Contains curly braces {} (i.e. object/map)
        let isAttributeValue = false
        let numericValue
        let isNumeric = true
        try {
          numericValue = Number.parseFloat(token)
          if (!numericValue || isNaN(numericValue)) {
            isNumeric = false
            throw new Error()
          }
          isAttributeValue = true
        } catch {
          const conditions = [`'`, `"`, `{`, `}`]
          isAttributeValue = conditions.some((x) => token.includes(x))
        }
        if (isAttributeValue) {
          valueIdx++
          const key = `:av${valueIdx}`
          attributeValues[key] = isNumeric ? numericValue ?? token : trimQuotes(token)
          filterExpression += key
        } else {
          // Others are attribute names
          // Check for . and split into multiple attribute names as appropriate.
          const names = token.split('.')
          const filterExpressionNames: string[] = []
          // Construct attribute names like { "#somename": "Some-Name" }
          names.forEach((n: string) => {
            const key = '#' + n.replace('-', '').toLowerCase()
            filterExpressionNames.push(key)
            attributeNames[key] = n
          })
          if (filterExpressionNames?.length > 0) {
            filterExpression += filterExpressionNames.join('.')
          }
        }
      }
    })
    filter = {
      sortKeyExpression,
      filterExpression,
      attributeNames,
      attributeValues,
    }
  } catch (e) {
    logger.error(`Error parsing search string: ${filterString}`)
    logger.error(e)
  }
  logger.debug('Search string parsed into filter: ', filter)
  return filter
}

// Remove only leading and trailing single/double quotes from string
export function trimQuotes(value: string) {
  let trimmed = value
  if (value.startsWith("'") || value.startsWith('"')) {
    trimmed = trimmed.slice(1)
  }
  if (value.endsWith("'") || value.endsWith('"')) {
    trimmed = trimmed.slice(0, trimmed.length - 1)
  }
  return trimmed
}