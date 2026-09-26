// src/hooks/useCouriers.ts
import { useMutation, useQuery } from '@tanstack/react-query'
import {
  fetchAllCouriers,
  fetchAvailableCouriers,
  fetchB2BRateQuotes,
  fetchCouriersWithDetails,
  fetchShippingRates,
  getCouriers,
  type CourierListResponse,
} from '../../api/courier'

interface UseCouriersParams {
  page?: number
  limit?: number
  filters?: Record<string, string | boolean | number>
}

export const useCouriers = ({ page, limit, filters = {} }: UseCouriersParams = {}) => {
  return useQuery<CourierListResponse>({
    queryKey: ['couriers', page, limit, filters],
    queryFn: () => getCouriers({ page, limit, filters }),
  })
}

export interface UseAvailableCouriersParams {
  pickupPincode: string
  pickupName?: string
  pickupId?: string
  pickupPhone?: string
  pickupAddress?: string
  pickupCity?: string
  pickupState?: string
  deliveryName?: string
  deliveryPhone?: string
  deliveryAddress?: string
  deliveryCity?: string
  deliveryState?: string
  deliveryPincode: string
  pickupAddressKey?: string
  deliveryAddressKey?: string
  weight?: number
  cod?: number
  orderAmount?: number
  length?: number
  breadth?: number
  height?: number
  pieceCount?: number
  boxes?: Array<{
    lengthCm?: number
    breadthCm?: number
    heightCm?: number
    weightKg?: number
    quantity?: number
  }>
  enabled?: boolean
  shipmentType?: 'b2b' | 'b2c'
  payment_type: 'cod' | 'prepaid' | 'reverse'
  freight_mode?: 'fop' | 'fod'
  rov_type?: 'owner' | 'courier' | 'none'
  context?: string
  isCalculator?: boolean
  isReverse?: boolean
  shadowfax_forward_mode?: 'marketplace' | 'warehouse'
  shadowfax_service_mode?: 'regular' | 'surface'
}

export const useAvailableCouriers = (params: UseAvailableCouriersParams) => {
  const {
    pickupPincode,
    deliveryPincode,
    pickupId,
    pickupAddressKey,
    deliveryAddressKey,
    weight,
    cod,
    orderAmount,
    length,
    breadth,
    height,
    enabled = true,
    shipmentType,
    payment_type,
  } = params

  const normalizedOrderAmount =
    typeof orderAmount === 'number' && orderAmount > 0 ? orderAmount : undefined
  const isReverseShipment = params.isReverse === true || payment_type === 'reverse'
  const isShipmentCourierSelection = params.context === 'shipment_courier_selection'
  const hasPositiveWeight = Number(weight) > 0
  const hasB2CPackageDimensions =
    shipmentType !== 'b2c' ||
    (Number(length) > 0 && Number(breadth) > 0 && Number(height) > 0)
  const hasRequiredB2COrderAmount =
    shipmentType !== 'b2c' || isReverseShipment || typeof normalizedOrderAmount === 'number'
  const canFetchAvailableCouriers =
    enabled &&
    !!pickupPincode &&
    !!deliveryPincode &&
    hasPositiveWeight &&
    hasB2CPackageDimensions &&
    hasRequiredB2COrderAmount

  return useQuery({
    queryKey: [
      'availableCouriers',
      pickupPincode,
      deliveryPincode,
      pickupId,
      pickupAddressKey,
      deliveryAddressKey,
      weight,
      cod,
      payment_type,
      orderAmount,
      length,
      breadth,
      height,
      shipmentType,
      params?.pickupName,
      params?.pickupPhone,
      params?.pickupAddress,
      params?.pickupCity,
      params?.pickupState,
      params?.deliveryName,
      params?.deliveryPhone,
      params?.deliveryAddress,
      params?.deliveryCity,
      params?.deliveryState,
      params?.context,
      params?.isCalculator,
      params?.isReverse,
      params?.shadowfax_forward_mode,
      params?.shadowfax_service_mode,
      params?.freight_mode,
      params?.rov_type,
    ],
    queryFn: () =>
      fetchAvailableCouriers({
        origin: pickupPincode,
        destination: deliveryPincode,
        pickupId,
        pickupName: params.pickupName,
        pickupPhone: params.pickupPhone,
        pickupAddress: params.pickupAddress,
        pickupCity: params.pickupCity,
        pickupState: params.pickupState,
        deliveryName: params.deliveryName,
        deliveryPhone: params.deliveryPhone,
        deliveryAddress: params.deliveryAddress,
        deliveryCity: params.deliveryCity,
        deliveryState: params.deliveryState,
        payment_type: payment_type,
        order_amount: normalizedOrderAmount,
        cod,
        weight,
        length,
        piece_count: params.pieceCount,
        boxes: params.boxes,
        ...(shipmentType && { shipment_type: shipmentType }),
        context: params.context,
        isCalculator: params.isCalculator === true || params.context === 'rate_calculator',
        isReverse: params.isReverse,
        shadowfax_forward_mode: params.shadowfax_forward_mode,
        shadowfax_service_mode: params.shadowfax_service_mode,
        freight_mode: params.freight_mode,
        rov_type: params.rov_type,
        breadth,
        height,
      }),
    enabled: canFetchAvailableCouriers,
    staleTime: isShipmentCourierSelection ? 0 : 1000 * 60 * 5,
    refetchOnMount: isShipmentCourierSelection ? 'always' : true,
    retry: isShipmentCourierSelection ? 0 : 1,
  })
}

export const useAvailableCouriersMutation = () => {
  return useMutation({
    mutationFn: (params: UseAvailableCouriersParams) => {
      const normalizedOrderAmount =
        typeof params.orderAmount === 'number' && params.orderAmount > 0
          ? params.orderAmount
          : undefined

      return fetchAvailableCouriers({
        origin: params.pickupPincode,
        destination: params.deliveryPincode,
        pickupId: params.pickupId,
        pickupName: params.pickupName,
        pickupPhone: params.pickupPhone,
        pickupAddress: params.pickupAddress,
        pickupCity: params.pickupCity,
        pickupState: params.pickupState,
        deliveryName: params.deliveryName,
        deliveryPhone: params.deliveryPhone,
        deliveryAddress: params.deliveryAddress,
        deliveryCity: params.deliveryCity,
        deliveryState: params.deliveryState,
        payment_type: params.payment_type,
        order_amount: normalizedOrderAmount,
        cod: params.cod,
        weight: params.weight,
        length: params.length,
        breadth: params.breadth,
        height: params.height,
        piece_count: params.pieceCount,
        boxes: params.boxes,
        shipment_type: params?.shipmentType,
        context: params.context,
        isCalculator: params.isCalculator === true || params.context === 'rate_calculator',
        isReverse: params.isReverse,
        shadowfax_forward_mode: params.shadowfax_forward_mode,
        shadowfax_service_mode: params.shadowfax_service_mode,
        freight_mode: params.freight_mode,
        rov_type: params.rov_type,
      })
    },
    retry: 1,
  })
}

export const useB2BRateQuotesMutation = () => {
  return useMutation({
    mutationFn: (params: UseAvailableCouriersParams) => {
      const normalizedOrderAmount =
        typeof params.orderAmount === 'number' && params.orderAmount > 0
          ? params.orderAmount
          : undefined

      return fetchB2BRateQuotes({
        origin: params.pickupPincode,
        destination: params.deliveryPincode,
        pickupId: params.pickupId,
        payment_type: params.payment_type,
        order_amount: normalizedOrderAmount,
        weight: params.weight,
        length: params.length,
        breadth: params.breadth,
        height: params.height,
        piece_count: params.pieceCount,
        boxes: params.boxes,
        freight_mode: params.freight_mode,
        rov_type: params.rov_type,
        delivery_address: params.deliveryAddress,
        context: params.context,
        isCalculator: params.isCalculator === true || params.context === 'rate_calculator',
      })
    },
    retry: 1,
  })
}

export const useShippingRates = (filters = {}) => {
  return useQuery({
    queryKey: ['getShippingRates', filters],
    queryFn: () => fetchShippingRates(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useAllCouriers = () => {
  return useQuery({
    queryKey: ['allCouriers'],
    queryFn: () => fetchAllCouriers(),
  })
}

export const useAllCouriersWithDetails = () => {
  return useQuery({
    queryKey: ['allCouriers'],
    queryFn: () => fetchCouriersWithDetails(),
  })
}
