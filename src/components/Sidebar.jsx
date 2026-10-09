import { NavLink } from "react-router-dom";
import { Search, Bell } from "lucide-react";

function Sidebar() {
  const getNavClass = ({ isActive }) =>
    isActive ? "top-nav-link active" : "top-nav-link";

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
      </div>

      <div className="top-nav-right">
        <button className="icon-btn-dark"><Search size={18} /></button>
        <button className="icon-btn-dark relative">
          <Bell size={18} />
          <span className="notification-dot"></span>
        </button>
      </div>
    </nav>
  );
}

export default Sidebar;