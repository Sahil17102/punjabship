import assert from 'node:assert/strict'
import test from 'node:test'
import { csvBoolean, csvHeaderKey, csvNumber, parseCsvObjects, parseCsvRows } from './csv-imports.mjs'

test('CSV parser handles quoted commas, escaped quotes, CRLF and BOM', () => {
  const input = '\uFEFFPincode,City,Note\r\n141001,"Ludhiana, Punjab","Uses ""quotes"""\r\n'
  assert.deepEqual(parseCsvRows(input), [
    ['\uFEFFPincode', 'City', 'Note'],
    ['141001', 'Ludhiana, Punjab', 'Uses "quotes"'],
  ])
  assert.deepEqual(parseCsvObjects(input), {
    headers: ['pincode', 'city', 'note'],
    records: [{ __row: 2, pincode: '141001', city: 'Ludhiana, Punjab', note: 'Uses "quotes"' }],
  })
})

test('CSV helpers normalize template headers and typed values', () => {
  assert.equal(csvHeaderKey('North (Per Kg Forward)'), 'north_per_kg_forward')
  assert.equal(csvHeaderKey('COD %'), 'cod_percent')
  assert.equal(csvBoolean('YES'), true)
  assert.equal(csvBoolean('0'), false)
  assert.equal(csvNumber('1,250.50'), 1250.5)
  assert.equal(csvNumber(''), null)
  assert.equal(csvNumber('invalid'), null)
})
