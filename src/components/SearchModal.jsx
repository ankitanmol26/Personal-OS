import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, X, CheckSquare, Folder, FileText, Code, Calendar,
  Plane, CornerDownLeft, ArrowUpDown, Loader2, Sparkles, AlertCircle
} from "lucide-react";
import { getTasks } from "../services/taskService";
import { getProjects } from "../services/projectService";
import { getNotes } from "../services/noteService";
import { getProblems as getDsaProblems } from "../services/dsaService";
import { getPlannerTasks } from "../services/plannerService";
import { getTrips } from "../services/tripService";
import { normalizeSearchData, filterSearchResults } from "../utils/searchHelper";
import "./SearchModal.css";

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "tasks", label: "Tasks", icon: CheckSquare },
  { id: "projects", label: "Projects", icon: Folder },
  { id: "notes", label: "Notes", icon: FileText },
  { id: "dsa", label: "DSA", icon: Code },
  { id: "planner", label: "Planner", icon: Calendar },
  { id: "trips", label: "Trips", icon: Plane },
];

export default function SearchModal({ isOpen, onClose }) {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [dataItems, setDataItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef(null);
  const listRef = useRef(null);
  const navigate = useNavigate();

  // Load searchable data when modal opens
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    async function loadSearchData() {
      try {
        setLoading(true);
        setError(null);

        const [
          taskRes,
          projRes,
          noteRes,
          dsaRes,
          plannerRes,
          tripRes
        ] = await Promise.allSettled([
          getTasks(),
          getProjects(),
          getNotes(),
          getDsaProblems(),
          getPlannerTasks(),
          getTrips(),
        ]);

        if (!isMounted) return;

        const tasks = taskRes.status === "fulfilled" ? taskRes.value || [] : [];
        const projects = projRes.status === "fulfilled" ? projRes.value || [] : [];
        const notes = noteRes.status === "fulfilled" ? noteRes.value || [] : [];
        const dsaProblems = dsaRes.status === "fulfilled" ? dsaRes.value || [] : [];
        const plannerTasks = plannerRes.status === "fulfilled" ? plannerRes.value || [] : [];
        const trips = tripRes.status === "fulfilled" ? tripRes.value || [] : [];

        const normalized = normalizeSearchData({
          tasks,
          projects,
          notes,
          dsaProblems,
          plannerTasks,
          trips,
        });

        setDataItems(normalized);
      } catch (err) {
        if (isMounted) {
          console.error("Error loading search data:", err);
          setError("Failed to load search data");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadSearchData();

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Autofocus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      setSelectedIndex(0);
    } else {
      setQuery("");
      setSelectedCategory("all");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Filtered search results
  const filteredResults = useMemo(() => {
    return filterSearchResults(dataItems, query, selectedCategory);
  }, [dataItems, query, selectedCategory]);

  // Match counts per category for the current query
  const categoryCounts = useMemo(() => {
    const counts = { all: 0, tasks: 0, projects: 0, notes: 0, dsa: 0, planner: 0, trips: 0 };
    if (!dataItems.length) return counts;

    const allMatches = filterSearchResults(dataItems, query, 'all');
    counts.all = allMatches.length;

    for (const item of allMatches) {
      if (counts[item.category] !== undefined) {
        counts[item.category]++;
      }
    }
    return counts;
  }, [dataItems, query]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredResults.length, selectedCategory]);

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.querySelector(".search-item.selected");
      if (activeEl) {
        activeEl.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex]);

  const handleSelectItem = useCallback((item) => {
    onClose();
    if (item.link) {
      navigate(item.link);
    }
  }, [navigate, onClose]);

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (filteredResults.length > 0) {
        setSelectedIndex((prev) => (prev + 1) % filteredResults.length);
      }
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (filteredResults.length > 0) {
        setSelectedIndex((prev) =>
          prev <= 0 ? filteredResults.length - 1 : prev - 1
        );
      }
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      if (filteredResults.length > 0 && filteredResults[selectedIndex]) {
        handleSelectItem(filteredResults[selectedIndex]);
      }
    }
  };

  if (!isOpen) return null;

  const getItemIcon = (category) => {
    switch (category) {
      case "tasks":
        return <CheckSquare size={16} />;
      case "projects":
        return <Folder size={16} />;
      case "notes":
        return <FileText size={16} />;
      case "dsa":
        return <Code size={16} />;
      case "planner":
        return <Calendar size={16} />;
      case "trips":
        return <Plane size={16} />;
      default:
        return <Sparkles size={16} />;
    }
  };

  return (
    <div
      className="search-modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Search PersonalOS"
    >
      <div
        className="search-modal-card"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="search-input-wrapper">
          <Search size={20} className="search-input-icon" />
          <input
            ref={inputRef}
            type="text"
            className="search-input-field"
            placeholder="Search tasks, projects, notes, DSA, planner, trips..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search input"
          />
          {loading && <Loader2 size={18} className="search-loader spin" />}
          {query && !loading && (
            <button
              className="search-clear-btn"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              title="Clear search"
              aria-label="Clear search query"
            >
              <X size={16} />
            </button>
          )}
          <span className="search-kbd-hint">ESC</span>
        </div>

        {/* Category Pills */}
        <div className="search-categories">
          {CATEGORIES.map((cat) => {
            const count = categoryCounts[cat.id];
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                className={`search-category-pill ${isActive ? "active" : ""}`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                <span>{cat.label}</span>
                {query && <span className="cat-count">({count})</span>}
              </button>
            );
          })}
        </div>

        {/* Results Body */}
        <div className="search-results-body" ref={listRef}>
          {error ? (
            <div className="search-feedback-state error">
              <AlertCircle size={28} />
              <p>{error}</p>
            </div>
          ) : filteredResults.length === 0 ? (
            <div className="search-feedback-state empty">
              {query ? (
                <>
                  <div className="search-empty-icon">
                    <Search size={28} />
                  </div>
                  <h4>No results found for &ldquo;{query}&rdquo;</h4>
                  <p>Check your spelling or switch category filters.</p>
                </>
              ) : (
                <div className="search-empty-guidance">
                  <div className="search-quick-links-title">
                    <Sparkles size={16} />
                    <span>Quick Navigation</span>
                  </div>
                  <div className="search-quick-links-grid">
                    <button onClick={() => { onClose(); navigate("/tasks"); }}>
                      <CheckSquare size={16} /> Tasks
                    </button>
                    <button onClick={() => { onClose(); navigate("/projects"); }}>
                      <Folder size={16} /> Projects
                    </button>
                    <button onClick={() => { onClose(); navigate("/notes"); }}>
                      <FileText size={16} /> Notes
                    </button>
                    <button onClick={() => { onClose(); navigate("/dsa"); }}>
                      <Code size={16} /> DSA
                    </button>
                    <button onClick={() => { onClose(); navigate("/planner"); }}>
                      <Calendar size={16} /> Planner
                    </button>
                    <button onClick={() => { onClose(); navigate("/finance"); }}>
                      <Plane size={16} /> Finance & Trips
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <ul className="search-results-list" role="listbox">
              {filteredResults.map((item, idx) => {
                const isSelected = idx === selectedIndex;
                return (
                  <li
                    key={item.id}
                    className={`search-item cat-${item.category} ${isSelected ? "selected" : ""}`}
                    onClick={() => handleSelectItem(item)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <div className={`search-item-icon cat-${item.category}`}>
                      {getItemIcon(item.category)}
                    </div>
                    <div className="search-item-info">
                      <div className="search-item-header">
                        <span className="search-item-title">{item.title}</span>
                        <span className={`search-badge cat-${item.category}`}>
                          {item.categoryLabel}
                        </span>
                      </div>
                      <p className="search-item-subtitle">{item.subtitle}</p>
                    </div>
                    <div className="search-item-enter">
                      <CornerDownLeft size={14} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="search-footer">
          <div className="search-footer-hint">
            <ArrowUpDown size={13} />
            <span>Navigate</span>
          </div>
          <div className="search-footer-hint">
            <CornerDownLeft size={13} />
            <span>Select</span>
          </div>
          <div className="search-footer-hint">
            <span>ESC Close</span>
          </div>
        </div>
      </div>
    </div>
  );
}
