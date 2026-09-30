import { readFileSync } from 'node:fs'
import { randomUUID } from 'node:crypto'
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const parseEnvFile = (file) => {
  if (!file) return {}
  try {
    return Object.fromEntries(readFileSync(file, 'utf8')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#') && line.includes('='))
      .map((line) => {
        const separator = line.indexOf('=')
        return [line.slice(0, separator).trim(), line.slice(separator + 1).trim().replace(/^(['"])(.*)\1$/, '$2')]
      }))
  } catch (error) {
    if (error?.code === 'ENOENT') return {}
    throw error
  }
}

const fileConfig = parseEnvFile(process.env.STORAGE_CONFIG_FILE)
const setting = (name, fallback = '') => process.env[name] || fileConfig[name] || fallback
const bucket = setting('R2_BUCKET', setting('PROD_BUCKET'))
const appPrefix = setting('R2_PREFIX', 'punjabship').replace(/^\/+|\/+$/g, '')

const normalizeEndpoint = (value) => {
  if (!value) return ''
  const url = new URL(value)
  url.pathname = ''
  url.search = ''
  url.hash = ''
  return url.toString().replace(/\/$/, '')
}

const endpoint = normalizeEndpoint(setting('R2_ENDPOINT'))
const accessKeyId = setting('R2_ACCESS_KEY_ID')
const secretAccessKey = setting('R2_SECRET_ACCESS_KEY')

export const isStorageConfigured = () => Boolean(endpoint && accessKeyId && secretAccessKey && bucket && appPrefix)
export const storageStatus = () => ({ configured: isStorageConfigured(), bucket: isStorageConfigured() ? bucket : null, prefix: isStorageConfigured() ? `${appPrefix}/` : null })

let client
const getClient = () => {
  if (!isStorageConfigured()) throw new Error('PunjabShip cloud storage is not configured.')
  if (!client) {
    client = new S3Client({
      region: 'auto',
      endpoint,
      credentials: { accessKeyId, secretAccessKey },
      requestChecksumCalculation: 'WHEN_REQUIRED',
      responseChecksumValidation: 'WHEN_REQUIRED',
    })
  }
  return client
}

const cleanSegment = (value, fallback) => String(value || fallback)
  .normalize('NFKD')
  .replace(/[^A-Za-z0-9._-]+/g, '-')
  .replace(/^[.-]+|[.-]+$/g, '')
  .slice(0, 120) || fallback

export const createObjectKey = ({ ownerId = 'shared', folder = 'files', filename = 'file', publicObject = false }) => {
  const scope = publicObject ? 'public' : `users/${cleanSegment(ownerId, 'unknown')}`
  const date = new Date().toISOString().slice(0, 10)
  const uniqueName = `${randomUUID()}-${cleanSegment(filename, 'file')}`
  return `${appPrefix}/${scope}/${cleanSegment(folder, 'files')}/${date}/${uniqueName}`
}

export const isPunjabShipKey = (key) => String(key || '').startsWith(`${appPrefix}/`)
export const isOwnerKey = (key, ownerId) => String(key || '').startsWith(`${appPrefix}/users/${cleanSegment(ownerId, 'unknown')}/`)

export const verifyStorage = async () => getClient().send(new HeadBucketCommand({ Bucket: bucket }))
export const ensureStoragePrefix = async () => getClient().send(new PutObjectCommand({
  Bucket: bucket,
  Key: `${appPrefix}/.keep`,
  Body: Buffer.from('PunjabShip isolated storage prefix.\n'),
  ContentType: 'text/plain; charset=utf-8',
  Metadata: { application: 'punjabship' },
}))

export const putObject = async ({ key, body, contentType, metadata = {} }) => {
  if (!isPunjabShipKey(key)) throw new Error('Storage key is outside the PunjabShip prefix.')
  return getClient().send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: contentType || 'application/octet-stream',
    Metadata: { application: 'punjabship', ...metadata },
  }))
}

export const headObject = async (key) => getClient().send(new HeadObjectCommand({ Bucket: bucket, Key: key }))
export const deleteObject = async (key) => getClient().send(new DeleteObjectCommand({ Bucket: bucket, Key: key }))
export const signedDownloadUrl = async (key, expiresIn = 3600) => {
  if (!isPunjabShipKey(key)) throw new Error('Storage key is outside the PunjabShip prefix.')
  return getSignedUrl(getClient(), new GetObjectCommand({ Bucket: bucket, Key: key }), { expiresIn })
}
export const signedUploadUrl = async ({ key, contentType, expiresIn = 900 }) => {
  if (!isPunjabShipKey(key)) throw new Error('Storage key is outside the PunjabShip prefix.')
  return getSignedUrl(getClient(), new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType }), { expiresIn })
}

export const storageBucket = bucket
