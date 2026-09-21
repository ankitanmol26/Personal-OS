import { Link } from "react-router-dom";

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="logo">
        PersonalOS
      </div>

      <nav>
        <Link to="/">Dashboard</Link>
        <Link to="/tasks">Tasks</Link>
        <Link to="/dsa">DSA Tracker</Link>
        <Link to="/projects">Projects</Link>
        <Link to="/notes">Notes</Link>
      </nav>
    </aside>
  );
}

export default Sidebar;