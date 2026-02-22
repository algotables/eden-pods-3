"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import {
  subscribeToNotifications,
  markNotificationRead,
  dismissNotification,
  getUnreadCount,
  AppNotification,
} from "@/lib/notifications";
import { useAuth } from "./AuthContext";

interface NotificationContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  markRead: (id: string) => Promise<void>;
  dismiss: (id: string) => Promise<void>;
  loading: boolean;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToNotifications(user.uid, (notifs) => {
      setNotifications(notifs);
      setLoading(false);
    });

    return unsubscribe;
  }, [user?.uid]);

  const markRead = async (id: string) => {
    await markNotificationRead(id);
  };

  const dismiss = async (id: string) => {
    await dismissNotification(id);
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount: getUnreadCount(notifications),
        markRead,
        dismiss,
        loading,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications(): NotificationContextValue {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationProvider");
  return ctx;
}
