// store/useAuthStore.js
import { jwtDecode } from 'jwt-decode'
import { create } from 'zustand'

function isTokenExpired(token) {
  try {
    const decoded = jwtDecode(token)
    return decoded.exp < Date.now() / 1000
  } catch (err) {
    return true // treat invalid/undecodable token as expired
  }
}

export const useAuthStore = create((set) => {
  const accessToken = localStorage.getItem('accessToken')
  const refreshToken = localStorage.getItem('refreshToken')
  const userId = localStorage.getItem('userId')
  let adminAccess = null
  try {
    adminAccess = JSON.parse(localStorage.getItem('adminAccess') || 'null')
  } catch {
    adminAccess = null
  }

  const isRefreshValid = refreshToken && !isTokenExpired(refreshToken)

  if (!isRefreshValid) {
    localStorage.clear()
  }

  return {
    token: isRefreshValid ? accessToken : null,
    refreshToken: isRefreshValid ? refreshToken : null,
    userId: isRefreshValid ? userId : null,
    adminAccess: isRefreshValid ? adminAccess : null,
    isLoggedIn: isRefreshValid && !!accessToken,

    login: (token, userId, refreshToken, user = {}) => {
      localStorage.setItem('accessToken', token)
      localStorage.setItem('refreshToken', refreshToken)
      localStorage.setItem('userId', userId)
      if (user.adminAccess) {
        localStorage.setItem('adminAccess', JSON.stringify(user.adminAccess))
      }

      set({
        token,
        refreshToken,
        userId,
        adminAccess: user.adminAccess || null,
        isLoggedIn: true,
      })
    },

    setAdminAccess: (adminAccess) => {
      localStorage.setItem('adminAccess', JSON.stringify(adminAccess))
      set({ adminAccess })
    },

    logout: () => {
      localStorage.clear()
      set({
        token: null,
        refreshToken: null,
        userId: null,
        adminAccess: null,
        isLoggedIn: false,
      })
    },
  }
})
