import { NavLink } from "react-router-dom";

function Sidebar() {
  return (
    <aside className="sidebar">

      <div className="logo">
        PersonalOS
      </div>

      <nav>

        <NavLink
          to="/"
          className={({ isActive }) =>
            isActive ? "active-link" : ""
          }
        >
          Dashboard
        </NavLink>

        <NavLink
          to="/tasks"
          className={({ isActive }) =>
            isActive ? "active-link" : ""
          }
        >
          Tasks
        </NavLink>

        <NavLink
          to="/dsa"
          className={({ isActive }) =>
            isActive ? "active-link" : ""
          }
        >
          DSA Tracker
        </NavLink>

        <NavLink
          to="/projects"
          className={({ isActive }) =>
            isActive ? "active-link" : ""
          }
        >
          Projects
        </NavLink>

        <NavLink
          to="/notes"
          className={({ isActive }) =>
            isActive ? "active-link" : ""
          }
        >
          Notes
        </NavLink>

      </nav>

    </aside>
  );
}

export default Sidebar;