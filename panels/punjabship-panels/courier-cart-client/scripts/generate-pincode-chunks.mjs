import { mkdir, readdir, rm, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const { loadData } = require('india-pincode')
const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const outputDirectory = resolve(scriptDirectory, '../public/pincodes')
const embeddedIndexFile = resolve(scriptDirectory, '../src/data/pincode-locations.json')
const officeRank = { HO: 3, SO: 2, PO: 2, BO: 1 }

const bestOfficeByPincode = new Map()
for (const office of loadData()) {
  if (!office.delivery) continue
  const pincode = String(office.pincode || '')
  if (!/^[1-9]\d{5}$/.test(pincode)) continue

  const current = bestOfficeByPincode.get(pincode)
  const rank = officeRank[String(office.officeType || '').toUpperCase()] || 0
  const currentRank = officeRank[String(current?.officeType || '').toUpperCase()] || 0
  if (!current || rank > currentRank || (rank === currentRank && String(office.area || '').length < String(current.area || '').length)) {
    bestOfficeByPincode.set(pincode, office)
  }
}

const chunks = new Map()
const embeddedIndex = {}
for (const [pincode, office] of bestOfficeByPincode) {
  const prefix = pincode.slice(0, 2)
  const chunk = chunks.get(prefix) || {}
  chunk[pincode] = {
    city: office.area,
    state: office.state,
    country: 'India',
  }
  embeddedIndex[pincode] = chunk[pincode]
  chunks.set(prefix, chunk)
}

await mkdir(outputDirectory, { recursive: true })
for (const file of await readdir(outputDirectory)) {
  if (/^\d{2}\.json$/.test(file)) await rm(resolve(outputDirectory, file))
}
await Promise.all([...chunks].map(([prefix, rows]) =>
  writeFile(resolve(outputDirectory, `${prefix}.json`), JSON.stringify(rows)),
))
await mkdir(dirname(embeddedIndexFile), { recursive: true })
await writeFile(embeddedIndexFile, JSON.stringify(embeddedIndex))

console.log(`Generated ${chunks.size} pincode chunks with ${bestOfficeByPincode.size} delivery pincodes.`)
