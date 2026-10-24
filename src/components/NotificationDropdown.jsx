import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCheck, RotateCw, Bell, AlertCircle, Calendar,
  CheckSquare, Folder, Code, X, ExternalLink
} from "lucide-react";
import { useNotifications } from "../context/NotificationContext";
import "./NotificationDropdown.css";

export default function NotificationDropdown({ isOpen, onClose, anchorRef }) {
  const [filter, setFilter] = useState("all"); // 'all' | 'unread'
  const { notifications, unreadCount, loading, error, markAsRead, markAllAsRead, refresh } = useNotifications();
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        anchorRef.current &&
        !anchorRef.current.contains(event.target)
      ) {
        onClose();
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose, anchorRef]);

  if (!isOpen) return null;

  const displayList = filter === "unread"
    ? notifications.filter((n) => !n.read)
    : notifications;

  const getCategoryIcon = (category) => {
    switch (category) {
      case "task":
        return <CheckSquare size={16} />;
      case "project":
        return <Folder size={16} />;
      case "planner":
        return <Calendar size={16} />;
      case "dsa":
        return <Code size={16} />;
      default:
        return <AlertCircle size={16} />;
    }
  };

  const handleItemClick = (item) => {
    markAsRead(item.id);
    onClose();
    if (item.link) {
      navigate(item.link);
    }
  };

  return (
    <div
      ref={dropdownRef}
      className="notification-dropdown"
      role="region"
      aria-label="Notifications panel"
    >
      {/* Header */}
      <div className="notification-header">
        <div className="notification-title-wrap">
          <Bell size={18} className="notification-header-icon" />
          <h3 className="notification-title">Notifications</h3>
          {unreadCount > 0 && (
            <span className="notification-badge">{unreadCount} new</span>
          )}
        </div>
        <div className="notification-actions">
          <button
            className="notif-btn-icon"
            onClick={refresh}
            title="Refresh notifications"
            disabled={loading}
            aria-label="Refresh notifications"
          >
            <RotateCw size={14} className={loading ? "spin" : ""} />
          </button>
          {unreadCount > 0 && (
            <button
              className="notif-btn-text"
              onClick={markAllAsRead}
              title="Mark all as read"
              aria-label="Mark all as read"
            >
              <CheckCheck size={14} />
              <span>Mark all read</span>
            </button>
          )}
          <button
            className="notif-btn-icon notif-close-mobile"
            onClick={onClose}
            aria-label="Close notifications"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="notification-tabs">
        <button
          className={`notification-tab ${filter === "all" ? "active" : ""}`}
          onClick={() => setFilter("all")}
        >
          All ({notifications.length})
        </button>
        <button
          className={`notification-tab ${filter === "unread" ? "active" : ""}`}
          onClick={() => setFilter("unread")}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* Body / List */}
      <div className="notification-body">
        {loading && notifications.length === 0 ? (
          <div className="notification-state">
            <div className="notif-skeleton-loader">
              <div className="skeleton-line"></div>
              <div className="skeleton-line short"></div>
            </div>
          </div>
        ) : error ? (
          <div className="notification-state error">
            <AlertCircle size={24} />
            <p>{error}</p>
            <button onClick={refresh} className="notif-retry-btn">
              Retry
            </button>
          </div>
        ) : displayList.length === 0 ? (
          <div className="notification-state empty">
            <div className="notif-empty-icon">
              <Bell size={28} />
            </div>
            <h4>All caught up!</h4>
            <p>
              {filter === "unread"
                ? "No unread notifications right now."
                : "No pending alerts, overdue tasks, or deadlines."}
            </p>
          </div>
        ) : (
          <ul className="notification-list">
            {displayList.map((item) => (
              <li
                key={item.id}
                className={`notification-item severity-${item.severity} ${
                  item.read ? "read" : "unread"
                }`}
                onClick={() => handleItemClick(item)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleItemClick(item);
                  }
                }}
              >
                <div className={`notif-icon-circle severity-${item.severity}`}>
                  {getCategoryIcon(item.category)}
                </div>
                <div className="notif-content">
                  <div className="notif-top-row">
                    <span className="notif-item-title">{item.title}</span>
                    {!item.read && <span className="notif-unread-dot" />}
                  </div>
                  <p className="notif-message">{item.message}</p>
                  {item.detail && (
                    <span className="notif-detail">{item.detail}</span>
                  )}
                </div>
                <div className="notif-chevron">
                  <ExternalLink size={14} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
