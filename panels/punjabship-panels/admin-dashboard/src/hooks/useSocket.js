import { useEffect } from 'react'
import { io } from 'socket.io-client'
import { useAuthStore } from 'store/useAuthStore'
import { useNotificationsStore } from 'store/useNotificationsStore'

export const useSocket = () => {
  const { userId } = useAuthStore()
  const { addNotification } = useNotificationsStore()

  useEffect(() => {
    if (!userId) return

    const socket = io(process.env.REACT_APP_SOCKET_URL || 'http://127.0.0.1:5004', { autoConnect: false })

    socket.emit('register', userId)

    socket.on('new_notification', (notification) => {
      addNotification(notification)
    })

    return () => {
      socket.disconnect()
    }
  }, [userId])
}
