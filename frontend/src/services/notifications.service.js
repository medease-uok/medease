import api from './api';

let DUMMY_NOTIFICATIONS = [
  {
    id: '1',
    type: 'appointment_scheduled',
    title: 'Appointment Scheduled',
    message: 'Your appointment with Dr. Smith is scheduled for tomorrow at 2:00 PM',
    is_read: false,
    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    reference_id: 'appt-001',
    reference_type: 'appointment',
  },
  {
    id: '2',
    type: 'prescription_created',
    title: 'Prescription Created',
    message: 'Dr. Johnson prescribed Amoxicillin 500mg for your infection',
    is_read: false,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    reference_id: 'rx-001',
    reference_type: 'prescription',
  },
  {
    id: '3',
    type: 'lab_report_ready',
    title: 'Lab Report Ready',
    message: 'Your blood test results are now available in your medical records',
    is_read: false,
    created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    reference_id: 'lab-001',
    reference_type: 'lab_report',
  },
  {
    id: '4',
    type: 'refill_approved',
    title: 'Refill Approved',
    message: 'Your prescription refill for Lisinopril has been approved',
    is_read: true,
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    reference_id: 'refill-001',
    reference_type: 'refill',
  },
  {
    id: '5',
    type: 'appointment_reminder',
    title: 'Appointment Reminder',
    message: 'Reminder: You have an appointment with Dr. Wilson in 2 hours',
    is_read: true,
    created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    reference_id: 'appt-002',
    reference_type: 'appointment',
  },
  {
    id: '6',
    type: 'document_uploaded',
    title: 'Document Uploaded',
    message: 'Your insurance document has been successfully uploaded',
    is_read: true,
    created_at: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
    reference_id: 'doc-001',
    reference_type: 'document',
  },
];

const getDummyNotifications = () => JSON.parse(JSON.stringify(DUMMY_NOTIFICATIONS));

const notificationsService = {
  getNotifications: async (options = {}) => {
    try {
      const { page = 1, limit = 10, type = null, is_read = null, sort = '-created_at' } = options;
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', limit);
      params.append('sort', sort);
      if (type) params.append('type', type);
      if (is_read !== null) params.append('is_read', is_read);
      const response = await api.get(`/api/notifications?${params.toString()}`);
      return response;
    } catch (error) {
      console.warn('Using dummy data for notifications:', error.message);
      let filtered = getDummyNotifications();
      if (options.type) {
        filtered = filtered.filter(n => n.type === options.type);
      }
      if (options.is_read !== null) {
        filtered = filtered.filter(n => n.is_read === options.is_read);
      }
      filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      const start = (options.page - 1) * options.limit;
      const paginated = filtered.slice(start, start + options.limit);
      return {
        notifications: paginated,
        total: filtered.length,
        page: options.page,
        limit: options.limit,
        pages: Math.ceil(filtered.length / options.limit),
      };
    }
  },

  getNotification: async (notificationId) => {
    try {
      const response = await api.get(`/api/notifications/${notificationId}`);
      return response;
    } catch (error) {
      console.warn('Using dummy data for single notification:', error.message);
      const notification = DUMMY_NOTIFICATIONS.find(n => n.id === notificationId);
      return notification || { error: 'Notification not found' };
    }
  },

  getUnreadCount: async () => {
    try {
      const response = await api.get('/api/notifications/count/unread');
      return response;
    } catch (error) {
      console.warn('Using dummy data for unread count:', error.message);
      const unreadCount = DUMMY_NOTIFICATIONS.filter(n => !n.is_read).length;
      return { unread_count: unreadCount };
    }
  },

  markAsRead: async (notificationId) => {
    try {
      const response = await api.put(`/api/notifications/${notificationId}/read`, {});
      return response;
    } catch (error) {
      console.warn('Simulating mark as read:', error.message);
      const notification = DUMMY_NOTIFICATIONS.find(n => n.id === notificationId);
      if (notification) {
        notification.is_read = true;
        return { success: true, notification };
      }
      return { success: false, error: 'Notification not found' };
    }
  },

  markAllAsRead: async () => {
    try {
      const response = await api.put('/api/notifications/read-all', {});
      return response;
    } catch (error) {
      console.warn('Simulating mark all as read:', error.message);
      DUMMY_NOTIFICATIONS.forEach(n => {
        n.is_read = true;
      });
      return { success: true, message: 'All notifications marked as read' };
    }
  },

  deleteNotification: async (notificationId) => {
    try {
      const response = await api.delete(`/api/notifications/${notificationId}`);
      return response;
    } catch (error) {
      console.warn('Simulating delete notification:', error.message);
      const index = DUMMY_NOTIFICATIONS.findIndex(n => n.id === notificationId);
      if (index !== -1) {
        DUMMY_NOTIFICATIONS.splice(index, 1);
        return { success: true, message: 'Notification deleted' };
      }
      return { success: false, error: 'Notification not found' };
    }
  },

  deleteAllNotifications: async () => {
    try {
      const response = await api.delete('/api/notifications');
      return response;
    } catch (error) {
      console.warn('Simulating delete all notifications:', error.message);
      DUMMY_NOTIFICATIONS.length = 0;
      return { success: true, message: 'All notifications deleted' };
    }
  },

  searchNotifications: async (query, options = {}) => {
    try {
      const params = new URLSearchParams();
      params.append('search', query);
      Object.entries(options).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          params.append(key, value);
        }
      });
      const response = await api.get(`/api/notifications?${params.toString()}`);
      return response;
    } catch (error) {
      console.warn('Searching dummy data:', error.message);
      const lowerQuery = query.toLowerCase();
      let filtered = DUMMY_NOTIFICATIONS.filter(n =>
        n.title.toLowerCase().includes(lowerQuery) || n.message.toLowerCase().includes(lowerQuery)
      );
      filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      const start = (options.page - 1) * options.limit;
      const paginated = filtered.slice(start, start + options.limit);
      return {
        notifications: paginated,
        total: filtered.length,
        page: options.page || 1,
        limit: options.limit || 10,
        pages: Math.ceil(filtered.length / (options.limit || 10)),
      };
    }
  },
};

export default notificationsService;
