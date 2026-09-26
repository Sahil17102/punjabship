import { jwtDecode } from 'jwt-decode'
import { useEffect } from 'react'
import { useHistory } from 'react-router-dom'
import { useAuthStore } from '../../store/useAuthStore'

function isTokenExpired(token) {
  try {
    const decoded = jwtDecode(token)
    return decoded.exp < Date.now() / 1000
  } catch {
    return true
  }
}

export const AdminRoute = ({ children }) => {
  const history = useHistory()
  const { token, refreshToken, logout } = useAuthStore()

  useEffect(() => {
    if (!token || !refreshToken || isTokenExpired(refreshToken)) {
      logout()
      history.replace('/auth/signin')
    }
  }, [token, refreshToken, logout, history])

  return children
}
