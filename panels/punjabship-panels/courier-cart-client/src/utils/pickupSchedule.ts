const formatDateInput = (value: Date) => {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const formatTimeInput = (value: Date) => {
  const hours = String(value.getHours()).padStart(2, '0')
  const minutes = String(value.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

export const getDefaultPickupSlot = (leadTimeMinutes = 60) => {
  const pickupAt = new Date(Date.now() + leadTimeMinutes * 60 * 1000)
  pickupAt.setSeconds(0, 0)

  return {
    pickupDate: formatDateInput(pickupAt),
    pickupTime: formatTimeInput(pickupAt),
  }
}

export const getDefaultPickupDateInput = () => getDefaultPickupSlot().pickupDate

export const getDefaultPickupTimeInput = () => getDefaultPickupSlot().pickupTime
