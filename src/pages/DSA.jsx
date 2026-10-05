import { useEffect, useState } from "react";
import { getStorage, setStorage } from "../utils/storage";
import { getTodayDate, addDays, isRevisionDue } from "../utils/date";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, CheckCircle, Circle, BookOpen, Activity, Target, Trash2, Hash } from "lucide-react";
import "../styles/DSA.css";

function getDifficultyClass(diff) {
  switch (diff) {
    case "Easy": return "dsa-badge easy";
    case "Medium": return "dsa-badge medium";
    case "Hard": return "dsa-badge hard";
    default: return "dsa-badge";
  }
}

function getRevisionClass(status) {
  switch (status) {
    case "Mastered": return "dsa-badge rev-mastered";
    case "Needs Revision": return "dsa-badge rev-needs";
    default: return "dsa-badge rev-not";
  }
}

function StatCard({ label, value, type, delay = 0 }) {
  const indicatorColor = {
    accent: "var(--accent-primary)",
    info: "var(--status-info)",
    success: "var(--status-success)",
    warning: "var(--status-warning)",
    neutral: "var(--text-muted)",
  }[type] || "var(--text-muted)";

  return (
    <motion.div 
      className="dsa-kpi-card"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: delay * 0.04, ease: "easeOut" }}
    >
      <div className="dsa-kpi-title">
        {label}
        <span className="dsa-kpi-indicator" style={{ backgroundColor: indicatorColor }} />
      </div>
      <div className="dsa-kpi-value">{value}</div>
    </motion.div>
  );
}

function DSA() {
  const [filter, setFilter] = useState("All");
  const [revisionFilter, setRevisionFilter] = useState("All");
  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("Arrays");
  const [difficulty, setDifficulty] = useState("Easy");
  const [platform, setPlatform] = useState("LeetCode");
  const [problemNumber, setProblemNumber] = useState("");
  const [problemLink, setProblemLink] = useState("");
  const [notes, setNotes] = useState("");

  const defaultProblems = [
    {
      id: 1, title: "Two Sum", topic: "Arrays", difficulty: "Easy", platform: "LeetCode", problemLink: "https://leetcode.com/problems/two-sum/",
      solved: true, revisionStatus: "Needs Revision",
    },
    {
      id: 2, title: "Second Largest Element", topic: "Arrays", difficulty: "Easy", platform: "GFG",
      solved: true, revisionStatus: "Not Started",
    },
    {
      id: 3, title: "Best Time to Buy and Sell Stock", topic: "Arrays", difficulty: "Easy", platform: "LeetCode",
      solved: false, revisionStatus: "Not Started",
    },
    {
      id: 4, title: "Maximum Subarray", topic: "Arrays", difficulty: "Medium", platform: "LeetCode",
      solved: false, revisionStatus: "Not Started",
    },
  ];

  const [problems, setProblems] = useState(() => {
    const savedProblems = getStorage("dsaProblems", null);
    return savedProblems ?? defaultProblems;
  });

  useEffect(() => {
    setStorage("dsaProblems", problems);
  }, [problems]);

  function addProblem(event) {
    event.preventDefault();
    if (title.trim() === "") return;

    const newProblem = {
      id: Date.now(),
      title, topic, difficulty, platform, problemNumber, problemLink, notes,
      solved: false, revisionStatus: "Not Started", revisionCount: 0, nextRevisionDate: null,
    };

    setProblems([...problems, newProblem]);
    setTitle(""); setTopic("Arrays"); setDifficulty("Easy"); setPlatform("LeetCode");
    setProblemNumber(""); setProblemLink(""); setNotes("");
  }

  function toggleSolved(id) {
    setProblems(problems.map((problem) => problem.id === id ? { ...problem, solved: !problem.solved } : problem));
  }
  
  function deleteProblem(id) {
    setProblems(problems.filter((problem) => problem.id !== id));
  }

  function updateRevisionStatus(id, status) {
    setProblems(problems.map((problem) => problem.id === id ? { ...problem, revisionStatus: status } : problem));
  }

  function reviseProblem(id) {
    const today = getTodayDate();
    setProblems(problems.map((problem) => {
      if (problem.id !== id) return problem;
      const revisionCount = (problem.revisionCount || 0) + 1;
      const intervals = [1, 3, 7, 14, 30];
      const interval = intervals[Math.min(revisionCount - 1, intervals.length - 1)];
      return {
        ...problem,
        revisionCount,
        revisionStatus: "Needs Revision",
        nextRevisionDate: addDays(today, interval),
      };
    }));
  }

  const totalProblems = problems.length;
  const solvedProblems = problems.filter((problem) => problem.solved).length;
  const pendingProblems = totalProblems - solvedProblems;
  const todayProblems = problems.filter((problem) => !problem.solved);
  const revisionProblems = problems.filter((problem) => isRevisionDue(problem));
  const masteredProblems = problems.filter((problem) => problem.revisionStatus === "Mastered").length;
  const dueRevisionCount = revisionProblems.length;
  
  const overallProgress = totalProblems === 0 ? 0 : Math.round((solvedProblems / totalProblems) * 100);

  const filteredProblems = problems.filter((problem) => {
    if (revisionFilter !== "All" && (problem.revisionStatus || "Not Started") !== revisionFilter) return false;
    if (filter === "Solved") return problem.solved;
    if (filter === "Unsolved") return !problem.solved;
    if (["Easy", "Medium", "Hard"].includes(filter)) return problem.difficulty === filter;
    return true;
  });

  return (
    <main className="dsa-page">
      <div className="dsa-header">
        <h2>DSA Tracker</h2>
        <p>Build consistency. Solve problems. Review what you've learned.</p>
      </div>

      <div className="dsa-kpi-grid">
        <StatCard label="Total Problems" value={totalProblems} type="neutral" delay={0} />
        <StatCard label="Solved" value={solvedProblems} type="success" delay={1} />
        <StatCard label="Remaining" value={pendingProblems} type="neutral" delay={2} />
        <StatCard label="Due for Revision" value={dueRevisionCount} type={dueRevisionCount > 0 ? "warning" : "neutral"} delay={3} />
        <StatCard label="Mastered" value={masteredProblems} type="info" delay={4} />
      </div>

      <div className="dsa-progress-card">
        <div className="dsa-progress-header">
          <span className="dsa-progress-title">Overall Progress</span>
          <span className="dsa-progress-value">{overallProgress}%</span>
        </div>
        <p className="dsa-progress-subtitle">{solvedProblems} / {totalProblems} solved</p>
        <div className="dsa-progress-track">
          <motion.div
            className="dsa-progress-fill"
            initial={{ width: "0%" }}
            animate={{ width: `${overallProgress}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
      </div>

      <div className="dsa-split-section">
        <section className="dsa-split-card">
          <div className="dsa-section-heading">
            <h3><Activity size={18} /> Due Today</h3>
            <p>Problems that are ready for revision now.</p>
          </div>
          {revisionProblems.length === 0 ? (
            <div className="dsa-empty-state" style={{ padding: '24px' }}>
              <p className="dsa-empty-desc">No revisions due today. Great job!</p>
            </div>
          ) : (
            <div className="dsa-activity-list">
              <AnimatePresence>
                {revisionProblems.slice(0, 5).map((problem, i) => (
                  <motion.div layout initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: i * 0.05 }} className="dsa-mini-card" key={problem.id}>
                    <div className="dsa-mini-content">
                      <span className="dsa-mini-title">{problem.title}</span>
                      <div className="dsa-mini-meta">
                        <span>{problem.topic}</span>
                        <span className={getDifficultyClass(problem.difficulty)}>{problem.difficulty}</span>
                        <span>Rev: {problem.revisionCount || 0}</span>
                      </div>
                    </div>
                    <button type="button" className="dsa-btn-secondary" onClick={() => reviseProblem(problem.id)}>
                      Revise
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </section>

        <section className="dsa-split-card">
          <div className="dsa-section-heading">
            <h3><Target size={18} /> Today's Target</h3>
            <p>Problems waiting to be solved.</p>
          </div>
          {todayProblems.length === 0 ? (
            <div className="dsa-empty-state" style={{ padding: '24px' }}>
              <p className="dsa-empty-desc">All problems are solved. Nice work!</p>
            </div>
          ) : (
            <div className="dsa-activity-list">
              <AnimatePresence>
                {todayProblems.slice(0, 5).map((problem, i) => (
                  <motion.div layout initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: i * 0.05 }} className="dsa-mini-card" key={problem.id}>
                    <div className="dsa-mini-content">
                      <span className="dsa-mini-title">{problem.title}</span>
                      <div className="dsa-mini-meta">
                        <span>{problem.topic}</span>
                        <span className={getDifficultyClass(problem.difficulty)}>{problem.difficulty}</span>
                      </div>
                    </div>
                    <button type="button" className="dsa-btn-secondary" onClick={() => toggleSolved(problem.id)}>
                      Solve
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </section>
      </div>

      <form className="dsa-form-card" onSubmit={addProblem}>
        <div className="dsa-section-heading" style={{ marginBottom: 0 }}>
          <h3>Add New Problem</h3>
          <p>Track a new DSA problem in your workspace.</p>
        </div>
        
        <div className="dsa-form-grid">
          <div className="dsa-input-group" style={{ gridColumn: 'span 2' }}>
            <label className="dsa-input-label">Problem Title</label>
            <input type="text" className="dsa-input" placeholder="e.g. Two Sum" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="dsa-input-group">
            <label className="dsa-input-label">Number (Optional)</label>
            <input type="number" className="dsa-input" placeholder="e.g. 1" value={problemNumber} onChange={(e) => setProblemNumber(e.target.value)} />
          </div>
          <div className="dsa-input-group" style={{ gridColumn: 'span 3' }}>
            <label className="dsa-input-label">URL (Optional)</label>
            <input type="url" className="dsa-input" placeholder="https://leetcode.com/problems/..." value={problemLink} onChange={(e) => setProblemLink(e.target.value)} />
          </div>
        </div>
        
        <div className="dsa-form-grid">
          <div className="dsa-input-group">
            <label className="dsa-input-label">Topic</label>
            <select className="dsa-input" value={topic} onChange={(e) => setTopic(e.target.value)}>
              {["Arrays", "Strings", "Hashing", "Recursion", "Linked List", "Stack", "Queue", "Binary Search", "Trees", "Graphs", "Dynamic Programming"].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="dsa-input-group">
            <label className="dsa-input-label">Difficulty</label>
            <select className="dsa-input" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
              <option value="Easy">Easy</option><option value="Medium">Medium</option><option value="Hard">Hard</option>
            </select>
          </div>
          <div className="dsa-input-group">
            <label className="dsa-input-label">Platform</label>
            <select className="dsa-input" value={platform} onChange={(e) => setPlatform(e.target.value)}>
              <option value="LeetCode">LeetCode</option><option value="GFG">GFG</option><option value="CodeChef">CodeChef</option><option value="HackerRank">HackerRank</option>
            </select>
          </div>
          <div className="dsa-input-group" style={{ gridColumn: 'span 2' }}>
            <label className="dsa-input-label">Quick Note (Optional)</label>
            <input type="text" className="dsa-input" placeholder="Approach used..." value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <div className="dsa-input-group" style={{ justifyContent: 'flex-end' }}>
            <button type="submit" className="dsa-btn-primary" style={{ height: '46px' }}>Add Problem</button>
          </div>
        </div>
      </form>

      <div className="dsa-controls-bar">
        <div className="dsa-controls-group flex-1">
          {["All", "Unsolved", "Solved", "Easy", "Medium", "Hard"].map((f) => (
            <button key={f} type="button" onClick={() => setFilter(f)} className={`dsa-filter-btn ${filter === f ? 'active' : ''}`}>
              {f}
            </button>
          ))}
        </div>
        <div className="dsa-controls-group">
          {["All", "Needs Revision", "Mastered"].map((f) => (
            <button key={`rev-${f}`} type="button" onClick={() => setRevisionFilter(f === "All" ? "All" : f)} className={`dsa-filter-btn ${revisionFilter === f || (f==="All" && revisionFilter==="All") ? 'active-secondary' : ''}`}>
              {f === "All" ? "All Revision" : f}
            </button>
          ))}
        </div>
      </div>

      <div className="dsa-list">
        {filteredProblems.length === 0 ? (
          <div className="dsa-empty-state">
            <span className="dsa-empty-title">No problems found</span>
            <span className="dsa-empty-desc">Start building your DSA progress by adding your first problem, or adjust your filters.</span>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredProblems.map((problem, i) => (
              <motion.div 
                layout 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, scale: 0.95 }} 
                transition={{ duration: 0.2, delay: i * 0.04 }} 
                className={`dsa-card ${problem.solved ? "solved" : ""}`} 
                key={problem.id}
              >
                <button 
                  className={`dsa-card-checkbox ${problem.solved ? "checked" : ""}`} 
                  onClick={() => toggleSolved(problem.id)}
                  aria-label={problem.solved ? "Mark unsolved" : "Mark solved"}
                >
                  <AnimatePresence mode="wait">
                    {problem.solved ? (
                      <motion.div key="check" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} transition={{ duration: 0.15 }}>
                        <CheckCircle size={22} />
                      </motion.div>
                    ) : (
                      <motion.div key="circle" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} transition={{ duration: 0.15 }}>
                        <Circle size={22} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
                
                <div className="dsa-card-content">
                  <div className="dsa-card-header">
                    <h3 className="dsa-card-title">{problem.title}</h3>
                    <div className="dsa-card-meta">
                      {problem.problemNumber && <span className="flex items-center gap-xs"><Hash size={12}/>{problem.problemNumber}</span>}
                      <span className="flex items-center gap-xs"><BookOpen size={14}/> {problem.topic}</span>
                      <span className={getDifficultyClass(problem.difficulty)}>{problem.difficulty}</span>
                      <span className="dsa-badge platform">{problem.platform}</span>
                      {problem.problemLink && (
                        <a href={problem.problemLink} target="_blank" rel="noreferrer" className="dsa-card-link">
                          <ExternalLink size={14} /> Open
                        </a>
                      )}
                    </div>
                  </div>
                  {problem.notes && (
                    <p className="dsa-card-notes">"{problem.notes}"</p>
                  )}
                </div>

                <div className="dsa-card-actions">
                  <div className="dsa-action-row">
                    <span className={getRevisionClass(problem.revisionStatus || "Not Started")}>
                      {problem.revisionStatus || "Not Started"}
                    </span>
                    <select className="dsa-select-small" value={problem.revisionStatus || "Not Started"} onChange={(e) => updateRevisionStatus(problem.id, e.target.value)}>
                      <option value="Not Started">Not Started</option>
                      <option value="Needs Revision">Needs Revision</option>
                      <option value="Mastered">Mastered</option>
                    </select>
                  </div>
                  <button type="button" className="dsa-btn-icon" onClick={() => deleteProblem(problem.id)} aria-label="Delete problem">
                    <Trash2 size={18} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </main>
  );
}

export default DSA;