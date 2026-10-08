import { io } from 'socket.io-client'

const SOCKET_URL =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'punjabship.com' || window.location.hostname === 'www.punjabship.com')
    ? 'https://api.punjabship.com'
    : import.meta.env.VITE_APP_SOCKET_URL || 'http://127.0.0.1:5004'
const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'], autoConnect: false })

let pingInterval: number | null = null

export const registerUserSocket = (user: { id: string; role: string }) => {
  if (user.role !== 'employee') return

  socket.emit('register', user.id)

  // Ping every 10 seconds to maintain online status
  pingInterval = window.setInterval(() => {
    socket.emit('employee_ping', user.id)
  }, 10000)

  socket.on('new_notification', (msg) => {
    console.log('Received notification:', msg)
  })
}

export const disconnectSocket = () => {
  if (pingInterval) {
    clearInterval(pingInterval)
    pingInterval = null
  }
  socket.disconnect()
}

export default socket
