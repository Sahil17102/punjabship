import axiosInstance from './axiosInstance'

export type ValidateInvoiceContentParams = {
  fileUrl: string
  invoiceValue: number
}

export type ValidateInvoiceContentResponse = {
  success: boolean
  data: {
    extractedData: {
      invoiceNumber?: string
      invoiceDate?: string
      billingName?: string
      sellerName?: string
      gstin?: string
      itemHSNs?: string[]
      totalValue?: number
    }
    warnings: string[] | null
    warningMessage: string | null
  }
}

/**
 * Validate invoice file content using OCR (soft validation - non-blocking)
 */
export const validateInvoiceContent = async (
  params: ValidateInvoiceContentParams,
): Promise<ValidateInvoiceContentResponse> => {
  const { data } = await axiosInstance.post<ValidateInvoiceContentResponse>(
    '/admin/b2b/invoices/validate-content',
    params,
  )
  return data
}

export type ValidateInvoiceFileParams = {
  fileName: string
  fileSize?: number
}

export type ValidateInvoiceFileResponse = {
  success: boolean
  message: string
}

/**
 * Validate invoice file type, size, and dangerous extensions
 */
export const validateInvoiceFile = async (
  params: ValidateInvoiceFileParams,
): Promise<ValidateInvoiceFileResponse> => {
  const { data } = await axiosInstance.post<ValidateInvoiceFileResponse>(
    '/admin/b2b/invoices/validate-file',
    params,
  )
  return data
}
