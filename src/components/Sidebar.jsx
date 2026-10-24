import { useState, useEffect, useRef } from "react";
import { NavLink } from "react-router-dom";
import { Search, Bell, User, Menu } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationContext";
import SearchModal from "./SearchModal";
import NotificationDropdown from "./NotificationDropdown";
import MobileNav from "./MobileNav";

function Sidebar() {
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const notifButtonRef = useRef(null);

  // Global keyboard shortcut: Ctrl+K or Cmd+K opens search
  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const getNavClass = ({ isActive }) =>
    isActive ? "top-nav-link active" : "top-nav-link";

  const getInitials = (name) => {
    if (!name) return "U";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <>
      <nav className="top-nav">
        <div className="top-nav-left">
          <button
            type="button"
            className={`icon-btn-dark mobile-menu-toggle-btn ${isMobileDrawerOpen ? "active" : ""}`}
            aria-label="Toggle navigation menu"
            aria-expanded={isMobileDrawerOpen}
            title="Menu"
            onClick={() => setIsMobileDrawerOpen((prev) => !prev)}
          >
            <Menu size={18} />
          </button>

          <NavLink to="/" className="top-nav-brand" title="PersonalOS">
            <img
              src="/personal-os-emblem.png"
              alt="PersonalOS Logo"
              className="top-nav-logo-icon"
            />
            <span className="logo-text-white">PersonalOS</span>
          </NavLink>
        </div>

        <div className="top-nav-center">
          <NavLink to="/" className={getNavClass}>
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/planner" className={getNavClass}>
            <span>Planner</span>
          </NavLink>
          <NavLink to="/tasks" className={getNavClass}>
            <span>Tasks</span>
          </NavLink>
          <NavLink to="/dsa" className={getNavClass}>
            <span>DSA</span>
          </NavLink>
          <NavLink to="/notes" className={getNavClass}>
            <span>Notes</span>
          </NavLink>
          <NavLink to="/projects" className={getNavClass}>
            <span>Projects</span>
          </NavLink>
          <NavLink to="/finance" className={getNavClass}>
            <span>Finance</span>
          </NavLink>
          <NavLink to="/profile" className={getNavClass}>
            <span>Profile</span>
          </NavLink>
        </div>

        <div className="top-nav-right">
          <button
            className="icon-btn-dark"
            aria-label="Search"
            title="Search (Ctrl+K)"
            onClick={() => setIsSearchOpen(true)}
          >
            <Search size={18} />
          </button>

          <div className="notif-anchor-wrap" style={{ position: "relative" }}>
            <button
              ref={notifButtonRef}
              className={`icon-btn-dark relative ${isNotificationsOpen ? "active" : ""}`}
              aria-label="Notifications"
              aria-expanded={isNotificationsOpen}
              title={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
              onClick={() => setIsNotificationsOpen((prev) => !prev)}
            >
              <Bell size={18} />
              {unreadCount > 0 && <span className="notification-dot"></span>}
            </button>
            <NotificationDropdown
              isOpen={isNotificationsOpen}
              onClose={() => setIsNotificationsOpen(false)}
              anchorRef={notifButtonRef}
            />
          </div>

          <NavLink to="/profile" className="profile-nav-btn" title="View Profile" aria-label="Profile">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name || "User"} className="nav-avatar-img" />
            ) : (
              <div className="nav-avatar-fallback">
                {user?.name ? getInitials(user.name) : <User size={16} />}
              </div>
            )}
          </NavLink>
        </div>
      </nav>

      {/* Responsive Mobile Navigation (Bottom bar and full drawer) */}
      <MobileNav
        isDrawerOpen={isMobileDrawerOpen}
        setIsDrawerOpen={setIsMobileDrawerOpen}
        onOpenSearch={() => setIsSearchOpen(true)}
        unreadCount={unreadCount}
      />

      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </>
  );
}

export default Sidebar;