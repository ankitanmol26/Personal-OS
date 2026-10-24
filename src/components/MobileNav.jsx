import { useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Calendar,
  CheckSquare,
  Code2,
  Folder,
  FileText,
  Plane,
  User,
  MoreHorizontal,
  X,
  Search,
  Bell,
  Sparkles
} from "lucide-react";
import "./MobileNav.css";

const PRIMARY_DESTINATIONS = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { path: "/planner", label: "Planner", icon: Calendar },
  { path: "/tasks", label: "Tasks", icon: CheckSquare },
  { path: "/dsa", label: "DSA", icon: Code2 },
];

const ALL_DESTINATIONS = [
  {
    path: "/",
    label: "Dashboard",
    description: "Overview, quick stats & recent items",
    icon: LayoutDashboard,
    end: true,
  },
  {
    path: "/tasks",
    label: "Tasks",
    description: "Action items, priorities & deadlines",
    icon: CheckSquare,
  },
  {
    path: "/planner",
    label: "Planner",
    description: "Daily agenda & scheduled blocks",
    icon: Calendar,
  },
  {
    path: "/dsa",
    label: "DSA Practice",
    description: "Coding problems & spaced revisions",
    icon: Code2,
  },
  {
    path: "/projects",
    label: "Projects",
    description: "Workspaces, tech stacks & roadmaps",
    icon: Folder,
  },
  {
    path: "/notes",
    label: "Notes",
    description: "Documentation, knowledge base & tags",
    icon: FileText,
  },
  {
    path: "/finance",
    label: "Finance & Trips",
    description: "Shared trip budgets & split expenses",
    icon: Plane,
  },
  {
    path: "/profile",
    label: "Profile & Account",
    description: "Personal details, security & settings",
    icon: User,
  },
];

export default function MobileNav({
  isDrawerOpen,
  setIsDrawerOpen,
  onOpenSearch,
  unreadCount = 0,
}) {
  const location = useLocation();

  // Close drawer on route change
  useEffect(() => {
    setIsDrawerOpen(false);
  }, [location.pathname, setIsDrawerOpen]);

  // Lock body scroll and handle Escape key when drawer is open
  useEffect(() => {
    if (!isDrawerOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(e) {
      if (e.key === "Escape") {
        setIsDrawerOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isDrawerOpen, setIsDrawerOpen]);

  // Check if current route is one of the secondary "More" routes
  const isMoreActive = ["/projects", "/notes", "/finance", "/profile"].includes(
    location.pathname
  );

  return (
    <>
      {/* Fixed Bottom Navigation Bar (Visible only on screens <= 768px) */}
      <nav
        className="mobile-bottom-nav"
        aria-label="Mobile Navigation"
      >
        <div className="mobile-bottom-nav-inner">
          {PRIMARY_DESTINATIONS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                className={({ isActive }) =>
                  `mobile-bottom-nav-item ${isActive ? "active" : ""}`
                }
              >
                <div className="mobile-nav-icon-wrap">
                  <Icon size={20} />
                </div>
                <span className="mobile-nav-label">{item.label}</span>
              </NavLink>
            );
          })}

          {/* "More" Trigger Button */}
          <button
            type="button"
            className={`mobile-bottom-nav-item ${isMoreActive || isDrawerOpen ? "active" : ""}`}
            onClick={() => setIsDrawerOpen((prev) => !prev)}
            aria-label="More navigation destinations"
            aria-expanded={isDrawerOpen}
          >
            <div className="mobile-nav-icon-wrap relative">
              <MoreHorizontal size={20} />
              {isMoreActive && <span className="mobile-more-indicator" />}
            </div>
            <span className="mobile-nav-label">More</span>
          </button>
        </div>
      </nav>

      {/* Slide-over / Bottom-sheet Drawer */}
      <div
        className={`mobile-drawer-backdrop ${isDrawerOpen ? "open" : ""}`}
        onClick={() => setIsDrawerOpen(false)}
        aria-hidden={!isDrawerOpen}
      >
        <aside
          className={`mobile-drawer ${isDrawerOpen ? "open" : ""}`}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-label="All application destinations"
        >
          {/* Top Drag Handle */}
          <div className="mobile-drawer-handle-bar">
            <span className="mobile-drawer-handle" />
          </div>

          {/* Drawer Header */}
          <div className="mobile-drawer-header">
            <div className="mobile-drawer-title-wrap">
              <div className="mobile-drawer-brand-icon">
                <Sparkles size={16} />
              </div>
              <div>
                <h3 className="mobile-drawer-title">All Destinations</h3>
                <p className="mobile-drawer-subtitle">PersonalOS Navigation</p>
              </div>
            </div>
            <button
              type="button"
              className="mobile-drawer-close-btn"
              onClick={() => setIsDrawerOpen(false)}
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
          </div>

          {/* Quick Actions (Search & Quick Status) */}
          <div className="mobile-drawer-quick-actions">
            <button
              type="button"
              className="mobile-quick-action-btn search"
              onClick={() => {
                setIsDrawerOpen(false);
                onOpenSearch?.();
              }}
            >
              <Search size={16} />
              <span>Quick Search (Ctrl+K)</span>
            </button>
          </div>

          {/* Full Destinations Grid */}
          <div className="mobile-drawer-content">
            <div className="mobile-destinations-grid">
              {ALL_DESTINATIONS.map((item) => {
                const Icon = item.icon;
                const isCurrent = item.end
                  ? location.pathname === item.path
                  : location.pathname.startsWith(item.path);

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.end}
                    className={`mobile-destination-card ${isCurrent ? "current" : ""}`}
                    onClick={() => setIsDrawerOpen(false)}
                  >
                    <div className="mobile-destination-icon">
                      <Icon size={20} />
                    </div>
                    <div className="mobile-destination-info">
                      <div className="mobile-destination-title-row">
                        <span className="mobile-destination-title">
                          {item.label}
                        </span>
                        {isCurrent && (
                          <span className="mobile-current-badge">Active</span>
                        )}
                      </div>
                      <p className="mobile-destination-desc">
                        {item.description}
                      </p>
                    </div>
                  </NavLink>
                );
              })}
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
