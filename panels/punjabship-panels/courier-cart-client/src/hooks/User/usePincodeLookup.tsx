import { useEffect, useState } from 'react'
import type { UseFormClearErrors, UseFormSetError, UseFormSetValue } from 'react-hook-form'
import { lookupPincodeLocation, normalizePincode } from '../../api/locations'

const PINCODE_PATTERN = /^\d{6}$/

export function usePincodeLookup(
  pincode: string,
  type: 'pickup' | 'delivery',
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setValue: UseFormSetValue<any>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setError: UseFormSetError<any>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  clearErrors: UseFormClearErrors<any>,
) {
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let isActive = true

    async function fetchLocation() {
      const normalizedPincode = normalizePincode(pincode)

      if (!PINCODE_PATTERN.test(normalizedPincode)) {
        clearErrors(`${type}Pincode`)
        setValue(`${type}City`, '')
        setValue(`${type}State`, '')
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const location = await lookupPincodeLocation(normalizedPincode)

        if (!isActive) return

        if (!location) {
          setError(`${type}Pincode`, {
            type: 'manual',
            message: `Invalid ${type} pincode`,
          })
          setValue(`${type}City`, '')
          setValue(`${type}State`, '')
        } else {
          clearErrors(`${type}Pincode`)
          setValue(`${type}City`, location.city)
          setValue(`${type}State`, location.state)
        }
      } catch {
        if (!isActive) return

        setError(`${type}Pincode`, {
          type: 'manual',
          message: `Failed to fetch ${type} location`,
        })
        setValue(`${type}City`, '')
        setValue(`${type}State`, '')
      } finally {
        if (isActive) setLoading(false)
      }
    }

    fetchLocation()

    return () => {
      isActive = false
    }
  }, [pincode, type, setValue, setError, clearErrors])

  return loading
}
