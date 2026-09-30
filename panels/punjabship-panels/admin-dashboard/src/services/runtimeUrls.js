const isPunjabShipAdminHost =
  typeof window !== 'undefined' && window.location.hostname === 'admin.punjabship.com'

const configuredApiBaseUrl = String(process.env.REACT_APP_API_BASE_URL || '').trim()
const configuredSocketUrl = String(process.env.REACT_APP_SOCKET_URL || '').trim()

export const adminApiBaseUrl = isPunjabShipAdminHost
  ? 'https://api.punjabship.com/api'
  : configuredApiBaseUrl || 'http://127.0.0.1:5004/api'

export const adminSocketUrl = isPunjabShipAdminHost
  ? 'https://api.punjabship.com'
  : configuredSocketUrl || 'http://127.0.0.1:5004'
