// utils/labelPreferencesMapper.ts

import type { LabelPreferences } from '../api/labelPreference.api'
import type { LabelSettingsForm } from '../components/settings/Label/LabelSettings'

const defaultOrderInfo: Record<string, boolean> = {
  customerPhone: true,
  alternatePhone: false,
  billingGstin: false,
  ewayBillNumber: false,
  middleBarcode: false,
  orderNumber: true,
  skuBarcode: true,
}

const defaultShipperInfo: Record<string, boolean> = {
  brandLogo: true,
  shipperName: true,
  shipperAddress: true,
  shipperPhone: true,
  gstin: true,
  returnName: true,
  returnAddress: true,
  returnPhone: true,
}

const defaultProductInfo: Record<string, boolean> = {
  productCost: true,
}

export function mapApiToForm(prefs: LabelPreferences): LabelSettingsForm {
  return {
    orderInfo: {
      customerPhone: Boolean(prefs.order_info?.customerPhone ?? defaultOrderInfo.customerPhone),
      alternatePhone: Boolean(prefs.order_info?.alternatePhone ?? defaultOrderInfo.alternatePhone),
      billingGstin: Boolean(prefs.order_info?.billingGstin ?? defaultOrderInfo.billingGstin),
      ewayBillNumber: Boolean(prefs.order_info?.ewayBillNumber ?? defaultOrderInfo.ewayBillNumber),
      middleBarcode: Boolean(prefs.order_info?.middleBarcode ?? defaultOrderInfo.middleBarcode),
      orderNumber: Boolean(prefs.order_info?.orderNumber ?? defaultOrderInfo.orderNumber),
      skuBarcode: Boolean(prefs.order_info?.skuBarcode ?? defaultOrderInfo.skuBarcode),
    },
    shipperInfo: {
      brandLogo: Boolean(prefs.shipper_info?.brandLogo ?? defaultShipperInfo.brandLogo),
      shipperName: Boolean(prefs.shipper_info?.shipperName ?? defaultShipperInfo.shipperName),
      shipperAddress: Boolean(
        prefs.shipper_info?.shipperAddress ?? defaultShipperInfo.shipperAddress,
      ),
      shipperPhone: Boolean(prefs.shipper_info?.shipperPhone ?? defaultShipperInfo.shipperPhone),
      gstin: Boolean(prefs.shipper_info?.gstin ?? defaultShipperInfo.gstin),
      returnName: Boolean(prefs.shipper_info?.returnName ?? defaultShipperInfo.returnName),
      returnAddress: Boolean(
        prefs.shipper_info?.returnAddress ?? defaultShipperInfo.returnAddress,
      ),
      returnPhone: Boolean(prefs.shipper_info?.returnPhone ?? defaultShipperInfo.returnPhone),
    },
    productInfo: {
      productCost: Boolean(prefs.product_info?.productCost ?? defaultProductInfo.productCost),
    },
    charLimit: prefs.char_limit,
    maxItems: prefs.max_items,
    printer: prefs.printer_type === 'inkjet' ? 'a4' : prefs.printer_type,
  }
}

export function mapFormToApi(form: LabelSettingsForm): Partial<LabelPreferences> {
  return {
    order_info: form.orderInfo,
    shipper_info: form.shipperInfo,
    product_info: form.productInfo,
    char_limit: form.charLimit,
    max_items: form.maxItems,
    printer_type: form.printer,
  }
}
