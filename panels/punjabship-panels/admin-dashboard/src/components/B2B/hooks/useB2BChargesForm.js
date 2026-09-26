import { useEffect, useState } from 'react'

/**
 * Custom hook for managing B2B Additional Charges form state
 */
export const useB2BChargesForm = (charges) => {
  const [formData, setFormData] = useState({
    // Overhead charge fields (with dual-value fields)
    awbCharges: '',
    cftFactor: '',
    minimumChargeableAmount: '',
    minimumChargeableWeight: '',
    minimumChargeableMethod: 'whichever_is_higher',
    freeStorageDays: '',
    demurragePerAwbDay: '',
    demurragePerKgDay: '',
    demurrageMethod: 'whichever_is_higher',
    publicHolidayPickupCharge: '',
    fuelSurchargePercentage: '',
    greenTax: '',
    odaCharges: '',
    odaPerKgCharge: '',
    odaMethod: 'whichever_is_higher',
    csdDeliveryCharge: '',
    timeSpecificPerKg: '',
    timeSpecificPerAwb: '',
    timeSpecificMethod: 'whichever_is_higher',
    mallDeliveryPerKg: '',
    mallDeliveryPerAwb: '',
    mallDeliveryMethod: 'whichever_is_higher',
    deliveryReattemptPerKg: '',
    deliveryReattemptPerAwb: '',
    deliveryReattemptMethod: 'whichever_is_higher',
    handlingSinglePiece: '',
    handlingBelow100Kg: '',
    handling100To200Kg: '',
    handlingAbove200Kg: '',
    insuranceCharge: '',
    codFixedAmount: '',
    codPercentage: '',
    codMethod: 'whichever_is_higher',
    rovFixedAmount: '',
    rovPercentage: '',
    rovMethod: 'whichever_is_higher',
    liabilityLimit: '',
    liabilityMethod: 'whichever_is_lower',
    rovOwnerMinimum: '',
    rovCourierPercentage: '',
    rovCourierMinimum: '',
    packageHandling250To400PerKg: '',
    packageHandling400PlusPerKg: '',
    fodCharge: '',
    greenTaxPerKg: '',
    greenTaxMinimum: '',
    specialDeliveryPerKg: '',
    specialDeliveryMinimum: '',
    customFields: {},
    fieldDefinitions: {},
  })

  // Helper function to convert database value to form value
  const formatValue = (value) => {
    if (value === null || value === undefined || value === '') return ''
    const num = Number(value)
    return isNaN(num) ? '' : num.toString()
  }

  useEffect(() => {
    if (charges) {
      // Prefill form with existing database values (with dual-value fields)
      const baseFormData = {
        awbCharges: formatValue(charges.awb_charges),
        cftFactor: formatValue(charges.cft_factor),
        minimumChargeableAmount: formatValue(charges.minimum_chargeable_amount),
        minimumChargeableWeight: formatValue(charges.minimum_chargeable_weight),
        minimumChargeableMethod: charges.minimum_chargeable_method || 'whichever_is_higher',
        freeStorageDays: formatValue(charges.free_storage_days),
        demurragePerAwbDay: formatValue(charges.demurrage_per_awb_day),
        demurragePerKgDay: formatValue(charges.demurrage_per_kg_day),
        demurrageMethod: charges.demurrage_method || 'whichever_is_higher',
        publicHolidayPickupCharge: formatValue(charges.public_holiday_pickup_charge),
        fuelSurchargePercentage: formatValue(charges.fuel_surcharge_percentage),
        greenTax: formatValue(charges.green_tax),
        odaCharges: formatValue(charges.oda_charges),
        odaPerKgCharge: formatValue(charges.oda_per_kg_charge),
        odaMethod: charges.oda_method || 'whichever_is_higher',
        csdDeliveryCharge: formatValue(charges.csd_delivery_charge),
        timeSpecificPerKg: formatValue(charges.time_specific_per_kg),
        timeSpecificPerAwb: formatValue(charges.time_specific_per_awb || 500),
        timeSpecificMethod: charges.time_specific_method || 'whichever_is_higher',
        mallDeliveryPerKg: formatValue(charges.mall_delivery_per_kg),
        mallDeliveryPerAwb: formatValue(charges.mall_delivery_per_awb || 500),
        mallDeliveryMethod: charges.mall_delivery_method || 'whichever_is_higher',
        deliveryReattemptPerKg: formatValue(charges.delivery_reattempt_per_kg),
        deliveryReattemptPerAwb: formatValue(charges.delivery_reattempt_per_awb || 500),
        deliveryReattemptMethod: charges.delivery_reattempt_method || 'whichever_is_higher',
        handlingSinglePiece: formatValue(charges.handling_single_piece),
        handlingBelow100Kg: formatValue(charges.handling_below_100_kg),
        handling100To200Kg: formatValue(charges.handling_100_to_200_kg),
        handlingAbove200Kg: formatValue(charges.handling_above_200_kg),
        insuranceCharge: formatValue(charges.insurance_charge),
        codFixedAmount: formatValue(charges.cod_fixed_amount || 50),
        codPercentage: formatValue(charges.cod_percentage || 1),
        codMethod: charges.cod_method || 'whichever_is_higher',
        rovFixedAmount: formatValue(charges.rov_fixed_amount || 100),
        rovPercentage: formatValue(charges.rov_percentage || 0.5),
        rovMethod: charges.rov_method || 'whichever_is_higher',
        liabilityLimit: formatValue(charges.liability_limit || 5000),
        liabilityMethod: charges.liability_method || 'whichever_is_lower',
        rovOwnerMinimum: formatValue(charges.custom_fields?.rovOwnerMinimum ?? 50),
        rovCourierPercentage: formatValue(charges.custom_fields?.rovCourierPercentage ?? 0.25),
        rovCourierMinimum: formatValue(charges.custom_fields?.rovCourierMinimum ?? 150),
        packageHandling250To400PerKg: formatValue(
          charges.custom_fields?.packageHandling250To400PerKg ?? 1,
        ),
        packageHandling400PlusPerKg: formatValue(
          charges.custom_fields?.packageHandling400PlusPerKg ?? 3,
        ),
        fodCharge: formatValue(charges.custom_fields?.fodCharge ?? 200),
        greenTaxPerKg: formatValue(charges.custom_fields?.greenTaxPerKg ?? 0.4),
        greenTaxMinimum: formatValue(charges.custom_fields?.greenTaxMinimum ?? 80),
        specialDeliveryPerKg: formatValue(charges.custom_fields?.specialDeliveryPerKg ?? 5),
        specialDeliveryMinimum: formatValue(charges.custom_fields?.specialDeliveryMinimum ?? 500),
        customFields: charges.custom_fields || {},
        fieldDefinitions: charges.field_definitions || {},
      }

      setFormData(baseFormData)
    } else {
      // If no charges exist, reset to empty (admin can fill in)
      setFormData({
        awbCharges: '',
        cftFactor: '',
        minimumChargeableAmount: '',
        minimumChargeableWeight: '',
        minimumChargeableMethod: 'whichever_is_higher',
        freeStorageDays: '',
        demurragePerAwbDay: '',
        demurragePerKgDay: '',
        demurrageMethod: 'whichever_is_higher',
        publicHolidayPickupCharge: '',
        fuelSurchargePercentage: '',
        greenTax: '',
        odaCharges: '',
        odaPerKgCharge: '',
        odaMethod: 'whichever_is_higher',
        csdDeliveryCharge: '',
        timeSpecificPerKg: '',
        timeSpecificPerAwb: '',
        timeSpecificMethod: 'whichever_is_higher',
        mallDeliveryPerKg: '',
        mallDeliveryPerAwb: '',
        mallDeliveryMethod: 'whichever_is_higher',
        deliveryReattemptPerKg: '',
        deliveryReattemptPerAwb: '',
        deliveryReattemptMethod: 'whichever_is_higher',
        handlingSinglePiece: '',
        handlingBelow100Kg: '',
        handling100To200Kg: '',
        handlingAbove200Kg: '',
        insuranceCharge: '',
        codFixedAmount: '',
        codPercentage: '',
        codMethod: 'whichever_is_higher',
        rovFixedAmount: '',
        rovPercentage: '',
        rovMethod: 'whichever_is_higher',
        liabilityLimit: '',
        liabilityMethod: 'whichever_is_lower',
        rovOwnerMinimum: '50',
        rovCourierPercentage: '0.25',
        rovCourierMinimum: '150',
        packageHandling250To400PerKg: '1',
        packageHandling400PlusPerKg: '3',
        fodCharge: '200',
        greenTaxPerKg: '0.4',
        greenTaxMinimum: '80',
        specialDeliveryPerKg: '5',
        specialDeliveryMinimum: '500',
        customFields: {},
        fieldDefinitions: {},
      })
    }
  }, [charges])

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const updateCustomField = (fieldKey, property, value) => {
    setFormData((prev) => ({
      ...prev,
      customFields: {
        ...(prev.customFields || {}),
        [fieldKey]: {
          ...((prev.customFields?.[fieldKey] &&
          typeof prev.customFields[fieldKey] === 'object'
            ? prev.customFields[fieldKey]
            : {})),
          [property]: value,
        },
      },
    }))
  }

  const buildPayload = () => {
    const payload = {}
    const customFieldKeys = new Set([
      'rovOwnerMinimum',
      'rovCourierPercentage',
      'rovCourierMinimum',
      'packageHandling250To400PerKg',
      'packageHandling400PlusPerKg',
      'fodCharge',
      'greenTaxPerKg',
      'greenTaxMinimum',
      'specialDeliveryPerKg',
      'specialDeliveryMinimum',
    ])
    const customFields = { ...(formData.customFields || {}) }

    // Map all overhead charge fields
    Object.keys(formData).forEach((key) => {
      if (key === 'customFields' || key === 'fieldDefinitions') {
        return
      }
      if (customFieldKeys.has(key)) {
        const numValue = formData[key] === '' ? 0 : Number(formData[key])
        customFields[key] = Number.isNaN(numValue) ? 0 : numValue
        return
      }
      if (formData[key] !== null && formData[key] !== undefined) {
        if (key.endsWith('Method')) {
          // Enum fields: keep as string
          const defaultMethod =
            key.includes('minimumChargeable') ||
            key.includes('demurrage') ||
            key.includes('oda') ||
            key.includes('timeSpecific') ||
            key.includes('mallDelivery') ||
            key.includes('deliveryReattempt') ||
            key.includes('cod') ||
            key.includes('rov')
              ? 'whichever_is_higher'
              : key.includes('liability')
              ? 'whichever_is_lower'
              : ''
          payload[key] = formData[key] || defaultMethod
        } else {
          // Numeric fields
          const numValue = formData[key] === '' ? 0 : Number(formData[key])
          if (!isNaN(numValue)) {
            payload[key] = numValue
          }
        }
      }
    })

    payload.customFields = customFields
    payload.fieldDefinitions = {
      ...(formData.fieldDefinitions || {}),
      rovOwnerMinimum: {
        label: 'ROV Owner Risk Minimum',
        visible: true,
        group: 'Star Logistics VAS',
        unit: 'INR/LR',
      },
      rovCourierPercentage: {
        label: 'ROV Courier Risk Percentage',
        visible: true,
        group: 'Star Logistics VAS',
        unit: '%',
      },
      rovCourierMinimum: {
        label: 'ROV Courier Risk Minimum',
        visible: true,
        group: 'Star Logistics VAS',
        unit: 'INR/LR',
      },
      packageHandling250To400PerKg: {
        label: 'Package Handling 250-400kg',
        visible: true,
        group: 'Star Logistics VAS',
        unit: 'INR/kg',
      },
      packageHandling400PlusPerKg: {
        label: 'Package Handling >=400kg',
        visible: true,
        group: 'Star Logistics VAS',
        unit: 'INR/kg',
      },
      fodCharge: {
        label: 'Freight on Delivery (FOD) Charge',
        visible: true,
        group: 'Star Logistics VAS',
        unit: 'INR/LR',
      },
      greenTaxPerKg: {
        label: 'Green Tax Per Kg',
        visible: true,
        group: 'Star Logistics VAS',
        unit: 'INR/kg',
      },
      greenTaxMinimum: {
        label: 'Green Tax Minimum',
        visible: true,
        group: 'Star Logistics VAS',
        unit: 'INR/LR',
      },
      specialDeliveryPerKg: {
        label: 'Appointment / CSD / Army / Mall Per Kg',
        visible: true,
        group: 'Star Logistics VAS',
        unit: 'INR/kg',
      },
      specialDeliveryMinimum: {
        label: 'Appointment / CSD / Army / Mall Minimum',
        visible: true,
        group: 'Star Logistics VAS',
        unit: 'INR/LR',
      },
    }

    return payload
  }

  return {
    formData,
    setFormData,
    updateField,
    updateCustomField,
    buildPayload,
  }
}
