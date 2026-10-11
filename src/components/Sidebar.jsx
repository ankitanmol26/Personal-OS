import { NavLink } from "react-router-dom";
import { Search, Bell, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";

function Sidebar() {
  const { user } = useAuth();

  const getNavClass = ({ isActive }) =>
    isActive ? "top-nav-link active" : "top-nav-link";

  const getInitials = (name) => {
    if (!name) return "U";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <nav className="top-nav">
      <div className="top-nav-left">
        <div className="logo-icon-green">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
             <path d="M4 6H20M4 12H20M4 18H20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <span className="logo-text-white">PersonalOS</span>
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
        <button className="icon-btn-dark" aria-label="Search"><Search size={18} /></button>
        <button className="icon-btn-dark relative" aria-label="Notifications">
          <Bell size={18} />
          <span className="notification-dot"></span>
        </button>
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
  );
}

export default Sidebar;