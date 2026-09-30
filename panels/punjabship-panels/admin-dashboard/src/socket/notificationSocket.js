// notificationSocket.js
import { io } from 'socket.io-client'
import { adminSocketUrl } from '../services/runtimeUrls'

export const socket = io(adminSocketUrl, { autoConnect: false })

export function registerUser(userId) {
  socket.emit('register', userId)
}
