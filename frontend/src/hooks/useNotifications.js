import { useState, useCallback, useEffect, useRef } from 'react';
import notificationsService from '../services/notifications.service';
import { PAGINATION, FILTER_OPTIONS, SORT_OPTIONS } from '../constants/notifications';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [currentPage, setCurrentPage] = useState(PAGINATION.DEFAULT_PAGE);
  const [pageSize, setPageSize] = useState(PAGINATION.DEFAULT_LIMIT);

  const [filters, setFilters] = useState({
    status: FILTER_OPTIONS.ALL,
    type: null,
    sort: SORT_OPTIONS.RECENT,
    search: '',
  });

  const fetchInProgressRef = useRef(false);

  /**
   * Fetch notifications with current filters and pagination
   */
  const fetchNotifications = useCallback(async () => {
    if (fetchInProgressRef.current) return;

    fetchInProgressRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const options = {
        page: currentPage,
        limit: pageSize,
        sort: filters.sort,
      };

      if (filters.status === FILTER_OPTIONS.UNREAD) {
        options.is_read = false;
      } else if (filters.status === FILTER_OPTIONS.READ) {
        options.is_read = true;
      }

      if (filters.type) {
        options.type = filters.type;
      }

      let data;
      if (filters.search) {
        data = await notificationsService.searchNotifications(filters.search, options);
      } else {
        data = await notificationsService.getNotifications(options);
      }

      setNotifications(data.notifications || []);
      setTotalCount(data.total || 0);

      const countData = await notificationsService.getUnreadCount();
      setUnreadCount(countData.unread_count || 0);
    } catch (err) {
      setError(err.message || 'Failed to fetch notifications');
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
      fetchInProgressRef.current = false;
    }
  }, [currentPage, pageSize, filters]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  /**
   * Mark notification as read
   */
  const handleMarkAsRead = useCallback(async (notificationId) => {
    try {
      await notificationsService.markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === notificationId ? { ...notif, is_read: true } : notif
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  }, []);

  /**
   * Mark all as read
   */
  const handleMarkAllAsRead = useCallback(async () => {
    try {
      await notificationsService.markAllAsRead();
      setNotifications((prev) => prev.map((notif) => ({ ...notif, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  }, []);

  /**
   * Delete notification
   */
  const handleDeleteNotification = useCallback(async (notificationId) => {
    try {
      await notificationsService.deleteNotification(notificationId);
      setNotifications((prev) => prev.filter((notif) => notif.id !== notificationId));
      setTotalCount((prev) => prev - 1);
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  }, []);

  /**
   * Delete all
   */
  const handleDeleteAll = useCallback(async () => {
    try {
      await notificationsService.deleteAllNotifications();
      setNotifications([]);
      setTotalCount(0);
      setUnreadCount(0);
    } catch (err) {
      console.error('Error deleting all notifications:', err);
    }
  }, []);

  /**
   * Update filters
   */
  const updateFilters = useCallback((newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setCurrentPage(PAGINATION.DEFAULT_PAGE);
  }, []);

  /**
   * Clear filters
   */
  const clearFilters = useCallback(() => {
    setFilters({
      status: FILTER_OPTIONS.ALL,
      type: null,
      sort: SORT_OPTIONS.RECENT,
      search: '',
    });
    setCurrentPage(PAGINATION.DEFAULT_PAGE);
  }, []);

  return {
    notifications,
    unreadCount,
    totalCount,
    loading,
    error,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    filters,
    updateFilters,
    clearFilters,
    handleMarkAsRead,
    handleMarkAllAsRead,
    handleDeleteNotification,
    handleDeleteAll,
    refetch: fetchNotifications,
  };
};
