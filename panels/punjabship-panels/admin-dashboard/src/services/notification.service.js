// src/services/notificationService.js
import api from './axios' // your pre-configured axios instance

const normalizeNotification = (notification = {}) => ({
  ...notification,
  isRead: Boolean(notification.isRead ?? notification.read),
  read: Boolean(notification.read ?? notification.isRead),
})

export async function getNotifications() {
  const { data } = await api.get('/notifications')
  return {
    ...data,
    notifications: Array.isArray(data?.notifications)
      ? data.notifications.map(normalizeNotification)
      : [],
  }
}

export async function createNotification(payload) {
  const { data } = await api.post('/notifications', payload)
  return data
}

export async function markNotificationAsRead(id) {
  const { data } = await api.patch(`/notifications/${id}/read`)
  return data
}

export async function markAllNotificationsAsRead() {
  const { data } = await api.patch('/notifications/read-all')
  return data
}
