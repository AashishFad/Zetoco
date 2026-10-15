import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from '../services/notificationService';
import { useRealtimeNotifications } from '../hooks/useRealtimeNotifications';

const NotificationContext = createContext(null);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch initial notifications
  const fetchNotifications = useCallback(async () => {
    if (!user?.id) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [list, count] = await Promise.all([
        getNotifications({ limit: 50 }),
        getUnreadCount(),
      ]);

      setNotifications(list);
      setUnreadCount(count);
    } catch (err) {
      console.warn('Failed to load notifications:', err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Realtime notification handlers
  const handleRealtimeInsert = useCallback((newNotification) => {
    setNotifications((prev) => {
      if (prev.some((n) => n.id === newNotification.id)) return prev;
      return [newNotification, ...prev];
    });
    setUnreadCount((prev) => prev + 1);
  }, []);

  const handleRealtimeUpdate = useCallback((updatedPayload) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === updatedPayload.id ? { ...n, isRead: updatedPayload.isRead } : n))
    );
    // Recalculate unread count
    setNotifications((prev) => {
      const count = prev.filter((n) => !n.isRead).length;
      setUnreadCount(count);
      return prev;
    });
  }, []);

  // Hook up Realtime listener
  useRealtimeNotifications(user?.id, {
    onInsert: handleRealtimeInsert,
    onUpdate: handleRealtimeUpdate,
  });

  // Mark single notification as read
  const markNotificationAsRead = async (notificationId) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    await markAsRead(notificationId);
  };

  // Mark all notifications as read
  const markAllNotificationsAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);

    if (user?.id) {
      await markAllAsRead(user.id);
    }
  };

  // Delete notification
  const deleteNotificationItem = async (notificationId) => {
    const target = notifications.find((n) => n.id === notificationId);
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    if (target && !target.isRead) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }

    await deleteNotification(notificationId);
  };

  const value = {
    notifications,
    unreadCount,
    loading,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotificationItem,
    refreshNotifications: fetchNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}
