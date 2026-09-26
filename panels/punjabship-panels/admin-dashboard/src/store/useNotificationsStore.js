import { create } from 'zustand'

const normalizeNotification = (notification = {}) => ({
  ...notification,
  isRead: Boolean(notification.isRead ?? notification.read),
  read: Boolean(notification.read ?? notification.isRead),
})

export const useNotificationsStore = create((set) => ({
  notifications: [],
  unreadCount: 0,

  setNotifications: (notifications) =>
    set(() => {
      const normalized = (notifications || []).map(normalizeNotification)
      return {
        notifications: normalized,
        unreadCount: normalized.filter((n) => !n.isRead).length,
      }
    }),

  addNotification: (notification) =>
    set((state) => ({
      notifications: [normalizeNotification(notification), ...state.notifications],
      unreadCount: state.unreadCount + (normalizeNotification(notification).isRead ? 0 : 1),
    })),

  markAsRead: (id) =>
    set((state) => {
      const updated = state.notifications.map((n) =>
        n.id === id ? { ...n, isRead: true, read: true } : n,
      )
      return {
        notifications: updated,
        unreadCount: updated.filter((n) => !n.isRead).length,
      }
    }),

  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true, read: true })),
      unreadCount: 0,
    })),
}))
