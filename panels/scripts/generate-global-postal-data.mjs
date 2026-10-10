import { createReadStream, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'
import readline from 'node:readline'

const source = process.argv[2]
const output = resolve(process.argv[3] || fileURLToPath(new URL('../data/global-postal-codes.json.gz', import.meta.url)))

if (!source) {
  console.error('Usage: node panels/scripts/generate-global-postal-data.mjs <allCountries.txt> [output.gz]')
  process.exit(1)
}

const countries = new Map([
  ['CA', 'Canada'], ['US', 'United States'],
  ['AT', 'Austria'], ['BE', 'Belgium'], ['BG', 'Bulgaria'], ['HR', 'Croatia'],
  ['CY', 'Cyprus'], ['CZ', 'Czechia'], ['DK', 'Denmark'], ['EE', 'Estonia'],
  ['FI', 'Finland'], ['FR', 'France'], ['DE', 'Germany'], ['GR', 'Greece'],
  ['HU', 'Hungary'], ['IS', 'Iceland'], ['IE', 'Ireland'], ['IT', 'Italy'],
  ['LV', 'Latvia'], ['LI', 'Liechtenstein'], ['LT', 'Lithuania'],
  ['LU', 'Luxembourg'], ['MT', 'Malta'], ['NL', 'Netherlands'], ['NO', 'Norway'],
  ['PL', 'Poland'], ['PT', 'Portugal'], ['RO', 'Romania'], ['SK', 'Slovakia'],
  ['SI', 'Slovenia'], ['ES', 'Spain'], ['SE', 'Sweden'], ['CH', 'Switzerland'],
  ['GB', 'United Kingdom'],
])
const priority = new Map([...countries.keys()].map((code, index) => [code, index]))
const postalCodeTypes = {
  CA: 'routing-prefix',
  IE: 'routing-prefix',
  MT: 'routing-prefix',
  NL: 'routing-prefix',
  GB: 'routing-prefix',
}

// GeoNames intentionally publishes routing areas instead of delivery-point
// postcodes for some countries. It also includes country prefixes / CEDEX
// labels in a few exports. Keep those records useful without presenting them
// as complete postal codes.
const normalizeGeoNamesPostalCode = (countryCode, value) => {
  const postalCode = String(value || '').trim().toUpperCase().replace(/\s+/g, ' ')
  if (countryCode === 'CA') return postalCode.match(/^[A-Z]\d[A-Z]/)?.[0] || ''
  if (countryCode === 'IE') return postalCode.match(/^[A-Z0-9]{3}/)?.[0] || ''
  if (countryCode === 'MT') return postalCode.match(/^[A-Z]{3}/)?.[0] || ''
  if (countryCode === 'NL') return postalCode.match(/^\d{4}/)?.[0] || ''
  if (countryCode === 'GB') return postalCode.split(' ')[0] || ''
  if (countryCode === 'FR') return postalCode.match(/^\d{5}/)?.[0] || ''
  if (countryCode === 'LU') return postalCode.replace(/^L-/, '')
  return postalCode
}

const unique = new Map()
const input = readline.createInterface({ input: createReadStream(resolve(source)), crlfDelay: Infinity })

for await (const line of input) {
  const columns = line.split('\t')
  const code = columns[0]
  if (!countries.has(code)) continue
  const postalCode = normalizeGeoNamesPostalCode(code, columns[1])
  if (!postalCode) continue
  const key = `${code}\u0000${postalCode}`
  const next = [code, postalCode, String(columns[2] || '').trim(), String(columns[3] || '').trim()]
  const current = unique.get(key)
  if (!current || (!current[2] && next[2]) || (!current[3] && next[3])) unique.set(key, next)
}

const rows = [...unique.values()].sort((a, b) => (
  priority.get(a[0]) - priority.get(b[0]) ||
  a[1].localeCompare(b[1], 'en', { numeric: true })
))
const payload = {
  source: 'GeoNames Postal Code Data',
  generatedAt: new Date().toISOString(),
  countries: Object.fromEntries(countries),
  postalCodeTypes,
  rows,
}

mkdirSync(dirname(output), { recursive: true })
writeFileSync(output, gzipSync(JSON.stringify(payload), { level: 9 }))
console.log(`Generated ${rows.length.toLocaleString('en-US')} unique postal-code rows at ${output}`)
