import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void;
  markAsRead: (id: string) => void;
  clearAll: () => void;
  unreadCount: number;
  refreshNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

interface Props {
  children: ReactNode;
}

const API = "http://localhost:5000";

export const NotificationProvider: React.FC<Props> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // ================= FETCH =================
  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("token"); // ✅ FIX: always get latest token

      if (!token) return;

      const res = await fetch(`${API}/notifications`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) throw new Error("Failed to fetch notifications");

      const data = await res.json();

      // ✅ map backend → frontend format
      const formatted: Notification[] = data.map((n: any) => ({
        id: n.id,
        type: n.type || 'info',
        title: n.title,
        message: n.message,
        createdAt: n.created_at,
        read: n.is_read
      }));

      setNotifications(formatted);

    } catch (err) {
      console.error("NOTIFICATION FETCH ERROR:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // 🔥 auto refresh every 30 sec (until realtime added)
    const interval = setInterval(fetchNotifications, 30000);

    return () => clearInterval(interval);
  }, []);

  // ================= ADD =================
  const addNotification = async (
    notificationData: Omit<Notification, 'id' | 'createdAt' | 'read'>
  ) => {
    try {
      const token = localStorage.getItem("token");

      if (!token) return;

      await fetch(`${API}/notifications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(notificationData)
      });

      fetchNotifications();

    } catch (err) {
      console.error("ADD NOTIFICATION ERROR:", err);
    }
  };

  // ================= MARK AS READ =================
  const markAsRead = async (id: string) => {
    try {
      const token = localStorage.getItem("token");

      if (!token) return;

      await fetch(`${API}/notifications/${id}/read`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      // 🔥 instant UI update (no wait)
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );

    } catch (err) {
      console.error("MARK READ ERROR:", err);
    }
  };

  // ================= CLEAR =================
  const clearAll = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) return;

      await fetch(`${API}/notifications/clear`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setNotifications([]);

    } catch (err) {
      console.error("CLEAR ERROR:", err);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider value={{
      notifications,
      addNotification,
      markAsRead,
      clearAll,
      unreadCount,
      refreshNotifications: fetchNotifications
    }}>
      {children}
    </NotificationContext.Provider>
  );
};