// notificationSocket.js
import { io } from 'socket.io-client'
const URL = process.env.REACT_APP_SOCKET_URL || 'http://127.0.0.1:5004'
export const socket = io(URL, { autoConnect: false }) // Your backend URL

export function registerUser(userId) {
  socket.emit('register', userId)
}
