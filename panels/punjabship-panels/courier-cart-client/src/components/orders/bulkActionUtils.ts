import { saveAs } from 'file-saver'

export type DocumentType = 'label' | 'invoice' | 'manifest'

export type BulkOrderDocumentShape = {
  id: string | number
  type?: 'b2c' | 'b2b'
  order_id?: string | null
  order_number?: string | null
  awb_number?: string | null
  order_status?: string | null
  integration_type?: string | null
  courier_partner?: string | null
  label?: string | null
  label_key?: string | null
  label_url?: string | null
  manifest?: string | null
  manifest_key?: string | null
  manifest_url?: string | null
  invoice_link?: string | null
  invoice_key?: string | null
  invoice_url?: string | null
}

export type DocumentEntry = {
  key?: string | null
  url?: string | null
  fileName: string
  orderLabel: string
}

type ApiLikeError = {
  code?: string
  request?: unknown
  response?: {
    data?: {
      message?: string
      error?: string
    }
  }
  message?: string
}

export const BULK_DOCUMENT_DOWNLOAD_LIMIT = 100
export const BULK_LABEL_PDF_DOWNLOAD_LIMIT = 50

const B2C_MANIFESTABLE_STATUSES = new Set([
  'pending',
  'booked',
  'shipment_created',
  'manifest_failed',
  'manifest_generated',
  'pickup_initiated',
  'ready_to_pickup',
  'ready_for_pickup',
])

export const isHttpUrl = (value?: string | null) => typeof value === 'string' && /^https?:\/\//i.test(value)

export const getB2CManifestIdentifier = (order: BulkOrderDocumentShape) => {
  const awbNumber = String(order.awb_number || '').trim()
  if (awbNumber) return awbNumber

  const orderNumber = String(order.order_number || '').trim()
  return orderNumber || null
}

const isLikelyManifestDocumentReference = (value?: string | null) => {
  const reference = String(value || '').trim()
  if (!reference) return false
  if (isHttpUrl(reference)) return true

  const normalizedReference = reference.toLowerCase()
  return (
    normalizedReference.includes('/') ||
    normalizedReference.includes('manifest') ||
    normalizedReference.endsWith('.pdf')
  )
}

const hasManifestDocument = (order: BulkOrderDocumentShape) => {
  if (isLikelyManifestDocumentReference(order.manifest_url)) return true
  if (isLikelyManifestDocumentReference(order.manifest_key)) return true
  return isLikelyManifestDocumentReference(order.manifest)
}

export const getB2CManifestProvider = (order: BulkOrderDocumentShape) => {
  const integrationType = String(order.integration_type || '').trim().toLowerCase()
  const courierPartner = String(order.courier_partner || '').trim().toLowerCase()

  if (integrationType.includes('amazon') || courierPartner.includes('amazon')) {
    return 'amazon'
  }

  if (integrationType.includes('xpressbees') || courierPartner.includes('xpressbees')) {
    return 'xpressbees'
  }

  if (integrationType.includes('ekart') || courierPartner.includes('ekart')) {
    return 'ekart'
  }

  if (integrationType.includes('shadowfax') || courierPartner.includes('shadowfax')) {
    return 'shadowfax'
  }

  if (integrationType.includes('velocity') || courierPartner.includes('velocity')) {
    return 'velocity'
  }

  return 'delhivery'
}

export const isB2CManifestEligible = (order: BulkOrderDocumentShape) => {
  const status = String(order.order_status || '').trim().toLowerCase()
  const hasManifest = hasManifestDocument(order)
  const integrationType = String(order.integration_type || '').trim().toLowerCase()
  const localOrderId = String(order.order_id || '').trim().toLowerCase()
  const isMarketplaceSourceOrder =
    ['shopify', 'woocommerce'].includes(integrationType) ||
    localOrderId.startsWith('shopify_') ||
    localOrderId.startsWith('woocommerce_')

  if (!getB2CManifestIdentifier(order)) {
    return false
  }

  if (isMarketplaceSourceOrder && !String(order.awb_number || '').trim()) {
    return false
  }

  if (status === 'manifest_failed') {
    return true
  }

  if (hasManifest) {
    return false
  }

  return B2C_MANIFESTABLE_STATUSES.has(status)
}

const sanitizeFileNameSegment = (value: string) =>
  value
    .trim()
    .replace(/[^a-z0-9_-]+/gi, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

const getFileExtension = (value?: string | null) => {
  if (!value) return '.pdf'

  const path = isHttpUrl(value)
    ? (() => {
        try {
          return new URL(value).pathname
        } catch {
          return value
        }
      })()
    : value

  const match = path.match(/\.[a-z0-9]+$/i)
  return match?.[0] || '.pdf'
}

const triggerBrowserDownload = (url: string, fileName: string) => {
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.target = '_blank'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const createDownloadError = (message: string, code: string) => {
  const error = new Error(message) as Error & { code: string }
  error.code = code
  return error
}

export const downloadFile = async (url: string, fileName: string) => {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      if (response.status === 403 || response.status === 404) {
        throw createDownloadError(
          'The file is not available right now. It may still be generating or may need to be regenerated.',
          'FILE_UNAVAILABLE',
        )
      }

      throw new Error(`Download failed with status ${response.status}`)
    }

    const blob = await response.blob()
    saveAs(blob, fileName)
  } catch (error) {
    if ((error as { code?: string })?.code === 'FILE_UNAVAILABLE') {
      throw error
    }

    console.warn('Falling back to browser download for bulk file:', error)
    triggerBrowserDownload(url, fileName)
  }
}

export const getDocumentReference = (order: BulkOrderDocumentShape, type: DocumentType) => {
  if (type === 'label') {
    return {
      key:
        typeof order.label_key === 'string'
          ? order.label_key
          : typeof order.label === 'string' && !isHttpUrl(order.label)
            ? order.label
            : null,
      url: isHttpUrl(order.label_url)
        ? order.label_url
        : isHttpUrl(order.label)
          ? order.label
          : null,
    }
  }

  if (type === 'manifest') {
    return {
      key:
        typeof order.manifest_key === 'string' && isLikelyManifestDocumentReference(order.manifest_key)
          ? order.manifest_key
          : typeof order.manifest === 'string' &&
              !isHttpUrl(order.manifest) &&
              isLikelyManifestDocumentReference(order.manifest)
            ? order.manifest
            : null,
      url: isHttpUrl(order.manifest_url)
        ? order.manifest_url
        : isHttpUrl(order.manifest)
          ? order.manifest
          : null,
    }
  }

  return {
    key:
      typeof order.invoice_key === 'string'
        ? order.invoice_key
        : typeof order.invoice_link === 'string' && !isHttpUrl(order.invoice_link)
          ? order.invoice_link
          : null,
    url: isHttpUrl(order.invoice_url)
      ? order.invoice_url
      : isHttpUrl(order.invoice_link)
        ? order.invoice_link
        : null,
  }
}

export const getDownloadFileName = (
  order: BulkOrderDocumentShape,
  type: DocumentType,
  source?: string | null,
) => {
  const baseName =
    sanitizeFileNameSegment(
      String(order.order_number || order.awb_number || `${order.type || 'order'}-${order.id}`),
    ) || `order-${order.id}`

  return `${baseName}-${type}${getFileExtension(source)}`
}

export const getOrderDocumentLabel = (order: BulkOrderDocumentShape) =>
  String(order.order_number || order.awb_number || order.id)

export const getActionableErrorMessage = (error: unknown, fallback: string) => {
  const apiError = error as ApiLikeError
  const rawMessage = typeof apiError?.message === 'string' ? apiError.message.trim() : ''
  const responseMessage = apiError?.response?.data?.message
  const responseError = apiError?.response?.data?.error

  if (typeof responseMessage === 'string' && responseMessage.trim()) {
    return responseMessage.trim()
  }

  if (typeof responseError === 'string' && responseError.trim()) {
    return responseError.trim()
  }

  if (apiError?.code === 'ECONNABORTED' || /timeout/i.test(rawMessage)) {
    return 'The request is taking longer than expected. Please try again shortly.'
  }

  if (!apiError?.response && (/network error/i.test(rawMessage) || /failed to fetch/i.test(rawMessage))) {
    return 'Could not reach the server. Please check your connection and try again.'
  }

  if ((apiError as { code?: string })?.code === 'FILE_UNAVAILABLE') {
    return 'The file is not available right now. It may still be generating or may need to be regenerated.'
  }

  return (
    rawMessage ||
    fallback
  )
}

export const summarizeOrderNumbers = (
  values: Array<string | number>,
  maxVisible = 5,
) => {
  const normalized = values.map((value) => String(value)).filter(Boolean)
  if (normalized.length <= maxVisible) return normalized.join(', ')

  const visible = normalized.slice(0, maxVisible).join(', ')
  return `${visible} +${normalized.length - maxVisible} more`
}

export const summarizeMessages = (
  values: Array<string | number>,
  maxVisible = 2,
) => {
  const normalized = values.map((value) => String(value).trim()).filter(Boolean)
  if (normalized.length === 0) return ''
  if (normalized.length <= maxVisible) return normalized.join(' ')

  return `${normalized.slice(0, maxVisible).join(' ')} +${normalized.length - maxVisible} more issue(s).`
}

export const getArchiveFileNameFromHeaders = (
  headers: Record<string, string | undefined>,
  fallback: string,
) => {
  const contentDisposition =
    headers['content-disposition'] ||
    headers['Content-Disposition'] ||
    headers['x-punjabship-archive-name'] ||
    headers['X-PunjabShip-Archive-Name']

  if (!contentDisposition) return fallback

  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i)
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1])
    } catch {
      return utf8Match[1]
    }
  }

  const plainMatch = contentDisposition.match(/filename="?([^";]+)"?/i)
  if (plainMatch?.[1]) {
    return plainMatch[1]
  }

  return fallback
}
