const normalizeHeader = (value) => String(value || '')
  .replace(/^\uFEFF/, '')
  .trim()
  .toLowerCase()
  .replace(/%/g, ' percent ')
  .replace(/[^a-z0-9]+/g, '_')
  .replace(/^_+|_+$/g, '')

export const parseCsvRows = (input) => {
  const text = Buffer.isBuffer(input) ? input.toString('utf8') : String(input || '')
  const rows = []
  let row = []
  let field = ''
  let quoted = false

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') {
        field += '"'
        index += 1
      } else if (char === '"') {
        quoted = false
      } else {
        field += char
      }
      continue
    }

    if (char === '"') quoted = true
    else if (char === ',') {
      row.push(field)
      field = ''
    } else if (char === '\n') {
      row.push(field.replace(/\r$/, ''))
      if (row.some((value) => String(value).trim() !== '')) rows.push(row)
      row = []
      field = ''
    } else {
      field += char
    }
  }

  row.push(field.replace(/\r$/, ''))
  if (row.some((value) => String(value).trim() !== '')) rows.push(row)
  return rows
}

export const parseCsvObjects = (input) => {
  const rows = parseCsvRows(input)
  if (!rows.length) return { headers: [], records: [] }
  const headers = rows[0].map(normalizeHeader)
  const records = rows.slice(1).map((values, rowIndex) => {
    const record = { __row: rowIndex + 2 }
    headers.forEach((header, index) => {
      if (header) record[header] = String(values[index] ?? '').trim()
    })
    return record
  }).filter((record) => Object.entries(record).some(([key, value]) => key !== '__row' && value !== ''))
  return { headers, records }
}

export const csvHeaderKey = normalizeHeader

export const csvBoolean = (value) => ['1', 'true', 'yes', 'y', 'on'].includes(
  String(value || '').trim().toLowerCase(),
)

export const csvNumber = (value) => {
  if (value === undefined || value === null || String(value).trim() === '') return null
  const number = Number(String(value).replace(/,/g, '').trim())
  return Number.isFinite(number) ? number : null
}

