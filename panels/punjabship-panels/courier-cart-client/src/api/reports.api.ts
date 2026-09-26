import axiosInstance from './axiosInstance'

export interface CustomReportPayload {
  fromDate: string
  toDate: string
  selectedFields: string[]
}

export const downloadCustomReportCsv = async (payload: CustomReportPayload): Promise<Blob> => {
  const response = await axiosInstance.post('/reports/custom-export', payload, {
    responseType: 'blob',
  })
  return response.data
}

export interface ShipmentReportPayload {
  fromDate: string
  toDate: string
  courier?: string
  company?: string
  gstMode: 'with' | 'without'
}

export interface ShipmentReportOptions {
  couriers: string[]
  companies: string[]
  shipmentCount: number
}

export const fetchShipmentReportOptions = async (
  payload: Pick<ShipmentReportPayload, 'fromDate' | 'toDate'>,
): Promise<ShipmentReportOptions> => {
  const response = await axiosInstance.post('/reports/shipments/options', payload)
  return response.data.data
}

export const downloadShipmentReportCsv = async (payload: ShipmentReportPayload): Promise<Blob> => {
  const response = await axiosInstance.post('/reports/shipments/export', payload, {
    responseType: 'blob',
  })
  return response.data
}

