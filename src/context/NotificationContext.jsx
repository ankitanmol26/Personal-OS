import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext";
import { getTasks } from "../services/taskService";
import { getPlannerTasks } from "../services/plannerService";
import { getProjects } from "../services/projectService";
import { getProblems as getDsaProblems } from "../services/dsaService";
import { generateNotifications } from "../utils/notificationHelper";

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getStorageKey = useCallback(() => {
    return `personalos_read_notifications_${user?.id || 'anon'}`;
  }, [user?.id]);

  const getStoredReadIds = useCallback(() => {
    try {
      const stored = localStorage.getItem(getStorageKey());
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }, [getStorageKey]);

  const saveReadIds = useCallback((readIds) => {
    try {
      localStorage.setItem(getStorageKey(), JSON.stringify(readIds));
    } catch (e) {
      console.error("Failed to save read notifications to localStorage:", e);
    }
  }, [getStorageKey]);

  const fetchAndComputeNotifications = useCallback(async () => {
    if (!isAuthenticated) {
      setNotifications([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch active application data using Promise.allSettled for fault tolerance
      const results = await Promise.allSettled([
        getTasks(),
        getPlannerTasks(),
        getProjects(),
        getDsaProblems(),
      ]);

      const tasks = results[0].status === 'fulfilled' ? results[0].value || [] : [];
      const plannerTasks = results[1].status === 'fulfilled' ? results[1].value || [] : [];
      const projects = results[2].status === 'fulfilled' ? results[2].value || [] : [];
      const dsaProblems = results[3].status === 'fulfilled' ? results[3].value || [] : [];

      const readIds = getStoredReadIds();
      const generated = generateNotifications({
        tasks,
        plannerTasks,
        projects,
        dsaProblems,
        readIds,
      });

      setNotifications(generated);
    } catch (err) {
      console.error("Failed to load notifications:", err);
      setError("Unable to refresh notifications");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, getStoredReadIds]);

  useEffect(() => {
    fetchAndComputeNotifications();

    const onFocus = () => fetchAndComputeNotifications();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [fetchAndComputeNotifications]);

  const markAsRead = useCallback((notificationId) => {
    setNotifications((prev) => {
      const updated = prev.map((item) =>
        item.id === notificationId ? { ...item, read: true } : item
      );
      const readIds = updated.filter((item) => item.read).map((item) => item.id);
      saveReadIds(readIds);
      return updated;
    });
  }, [saveReadIds]);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => {
      const updated = prev.map((item) => ({ ...item, read: true }));
      const readIds = updated.map((item) => item.id);
      saveReadIds(readIds);
      return updated;
    });
  }, [saveReadIds]);

  const unreadCount = notifications.filter((item) => !item.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        error,
        markAsRead,
        markAllAsRead,
        refresh: fetchAndComputeNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}
