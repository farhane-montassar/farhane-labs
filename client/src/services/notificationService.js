import api from './api'

/**
 * Appels liés aux notifications (par utilisateur, backend authentifié).
 * Comme les autres services, on renvoie directement `data`.
 *
 * Backend :
 *  - GET   /notifications              -> data = { items: [...], unreadCount }
 *  - GET   /notifications/unread-count -> data = { unreadCount }   (léger, pour le polling)
 *  - PATCH /notifications/:id/read     -> data = la notif mise à jour
 *  - PATCH /notifications/read-all     -> data = { modified }
 */
export const notificationService = {
  async list() {
    const res = await api.get('/notifications')
    return res.data.data
  },

  async unreadCount() {
    const res = await api.get('/notifications/unread-count')
    return res.data.data.unreadCount
  },

  async markRead(id) {
    const res = await api.patch(`/notifications/${id}/read`)
    return res.data.data
  },

  async markAllRead() {
    const res = await api.patch('/notifications/read-all')
    return res.data.data
  },
}

export default notificationService
