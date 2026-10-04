import { useEffect, useState } from "react";
import { getStorage, setStorage } from "../utils/storage";
import { getTodayDate, addDays, isRevisionDue } from "../utils/date";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, CheckCircle, Circle, BookOpen, Clock, Activity, Target } from "lucide-react";

function getDifficultyBadge(diff) {
  switch (diff) {
    case "Easy": return "badge badge-success";
    case "Medium": return "badge badge-warning";
    case "Hard": return "badge badge-danger";
    default: return "badge";
  }
}

function getRevisionBadge(status) {
  switch (status) {
    case "Mastered": return "badge badge-success";
    case "Needs Revision": return "badge badge-warning";
    default: return "badge badge-info";
  }
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
      id: 1, title: "Two Sum", topic: "Arrays", difficulty: "Easy", platform: "LeetCode",
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
  
  const easyProblems = problems.filter((problem) => problem.difficulty === "Easy").length;
  const mediumProblems = problems.filter((problem) => problem.difficulty === "Medium").length;
  const hardProblems = problems.filter((problem) => problem.difficulty === "Hard").length;

  const filteredProblems = problems.filter((problem) => {
    if (revisionFilter !== "All" && (problem.revisionStatus || "Not Started") !== revisionFilter) return false;
    if (filter === "Solved") return problem.solved;
    if (filter === "Unsolved") return !problem.solved;
    if (["Easy", "Medium", "Hard"].includes(filter)) return problem.difficulty === filter;
    return true;
  });

  const topics = [...new Set(problems.map((problem) => problem.topic))];
  const topicProgress = topics.map((topic) => {
    const topicProblems = problems.filter((p) => p.topic === topic);
    const solved = topicProblems.filter((p) => p.solved).length;
    const total = topicProblems.length;
    return { topic, total, solved, percentage: total === 0 ? 0 : Math.round((solved / total) * 100) };
  });

  return (
    <main className="dashboard">
      <div className="dashboard-header">
        <h2>DSA Tracker</h2>
        <p className="page-description">Track your Data Structures and Algorithms progress.</p>
      </div>

      <div className="dashboard-grid">
        <div className="stat-card">
          <span className="stat-card-title">Total Problems</span>
          <strong className="stat-card-value">{totalProblems}</strong>
        </div>
        <div className="stat-card">
          <span className="stat-card-title">Solved</span>
          <strong className="stat-card-value">{solvedProblems}</strong>
        </div>
        <div className="stat-card">
          <span className="stat-card-title">Pending</span>
          <strong className="stat-card-value">{pendingProblems}</strong>
        </div>
        <div className="stat-card">
          <span className="stat-card-title">Due Today</span>
          <strong className="stat-card-value text-warning">{dueRevisionCount}</strong>
        </div>
        <div className="stat-card">
          <span className="stat-card-title">Mastered</span>
          <strong className="stat-card-value text-success">{masteredProblems}</strong>
        </div>
      </div>

      <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
        <section className="revision-today card" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <div className="section-heading">
            <h3 className="flex items-center gap-xs"><Activity size={18}/> Revision Due Today</h3>
            <p>Problems that are ready for revision now.</p>
          </div>
          {revisionProblems.length === 0 ? (
            <div className="empty-state" style={{ margin: 'auto' }}>
              <p>No revisions due today. Great job!</p>
            </div>
          ) : (
            <div className="activity-list" style={{ marginTop: '16px' }}>
              <AnimatePresence>
                {revisionProblems.slice(0, 5).map((problem) => (
                  <motion.div layout initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="activity-item" key={problem.id}>
                    <div className="activity-content flex-1">
                      <strong>{problem.title}</strong>
                      <span className="muted-text flex items-center gap-xs" style={{ display: 'flex', gap: '8px' }}>
                        <span>{problem.topic}</span>
                        <span className={getDifficultyBadge(problem.difficulty)}>{problem.difficulty}</span>
                        <span>Rev: {problem.revisionCount || 0}</span>
                      </span>
                    </div>
                    <button type="button" className="btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => reviseProblem(problem.id)}>Revise</button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </section>

        <div className="today-dsa card" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <div className="section-heading">
            <h3 className="flex items-center gap-xs"><Target size={18} /> Today's DSA</h3>
            <p>Problems waiting to be solved.</p>
          </div>
          {todayProblems.length === 0 ? (
            <div className="empty-state" style={{ margin: 'auto' }}>
              <p>All problems are solved. Nice work!</p>
            </div>
          ) : (
            <div className="activity-list" style={{ marginTop: '16px' }}>
              {todayProblems.slice(0, 5).map((problem) => (
                <div className="activity-item" key={problem.id}>
                  <div className="activity-content flex-1">
                    <strong>{problem.title}</strong>
                    <span className="muted-text flex items-center gap-xs" style={{ display: 'flex', gap: '8px' }}>
                      <span>{problem.topic}</span>
                      <span className={getDifficultyBadge(problem.difficulty)}>{problem.difficulty}</span>
                    </span>
                  </div>
                  <button className="btn-primary" style={{ padding: '6px 12px', fontSize: '12px', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }} onClick={() => toggleSolved(problem.id)}>Mark Solved</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="topic-progress card" style={{ padding: '24px', margin: '24px 0' }}>
        <div className="section-heading">
          <h3>Topic Progress</h3>
        </div>
        <div className="topic-progress-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' }}>
          {topicProgress.map((item) => (
            <div className="topic-progress-item" key={item.topic}>
              <div className="topic-progress-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                <span className="font-medium">{item.topic}</span>
                <span className="muted-text">{item.solved}/{item.total}</span>
              </div>
              <div className="progress-bar">
                <motion.div className="progress-fill" initial={{ width: "0%" }} whileInView={{ width: `${item.percentage}%` }} viewport={{ once: true }} transition={{ duration: 0.8 }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <form className="dsa-form card" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: '16px', padding: '24px' }} onSubmit={addProblem}>
        <div className="form-group flex-1" style={{ minWidth: '220px' }}>
          <label className="muted-text" style={{ display: 'block', marginBottom: '6px', fontSize: '13px' }}>Problem Title</label>
          <input type="text" className="input-field" placeholder="E.g. Two Sum" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="form-group" style={{ minWidth: '100px' }}>
          <label className="muted-text" style={{ display: 'block', marginBottom: '6px', fontSize: '13px' }}>Number</label>
          <input type="number" className="input-field" placeholder="1" value={problemNumber} onChange={(e) => setProblemNumber(e.target.value)} />
        </div>
        <div className="form-group flex-1" style={{ minWidth: '220px' }}>
          <label className="muted-text" style={{ display: 'block', marginBottom: '6px', fontSize: '13px' }}>URL</label>
          <input type="url" className="input-field" placeholder="https://leetcode.com/..." value={problemLink} onChange={(e) => setProblemLink(e.target.value)} />
        </div>
        
        <div style={{ width: '100%', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <div className="form-group flex-1" style={{ minWidth: '180px' }}>
            <label className="muted-text" style={{ display: 'block', marginBottom: '6px', fontSize: '13px' }}>Topic</label>
            <select className="input-field" value={topic} onChange={(e) => setTopic(e.target.value)}>
              {["Arrays", "Strings", "Hashing", "Recursion", "Linked List", "Stack", "Queue", "Binary Search", "Trees", "Graphs", "Dynamic Programming"].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ minWidth: '140px' }}>
            <label className="muted-text" style={{ display: 'block', marginBottom: '6px', fontSize: '13px' }}>Difficulty</label>
            <select className="input-field" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
              <option value="Easy">Easy</option><option value="Medium">Medium</option><option value="Hard">Hard</option>
            </select>
          </div>
          <div className="form-group" style={{ minWidth: '140px' }}>
            <label className="muted-text" style={{ display: 'block', marginBottom: '6px', fontSize: '13px' }}>Platform</label>
            <select className="input-field" value={platform} onChange={(e) => setPlatform(e.target.value)}>
              <option value="LeetCode">LeetCode</option><option value="GFG">GFG</option><option value="CodeChef">CodeChef</option><option value="HackerRank">HackerRank</option>
            </select>
          </div>
          <div className="form-group flex-1" style={{ minWidth: '220px' }}>
            <label className="muted-text" style={{ display: 'block', marginBottom: '6px', fontSize: '13px' }}>Quick Note</label>
            <input type="text" className="input-field" placeholder="Approach used..." value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button type="submit" className="btn-primary" style={{ height: '42px' }}>Add Problem</button>
          </div>
        </div>
      </form>

      <div className="planner-section card" style={{ padding: '24px' }}>
        <div className="task-filters" style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
          {["All", "Unsolved", "Solved", "Easy", "Medium", "Hard"].map((f) => (
            <button key={f} onClick={() => setFilter(f)} className="badge" style={{ cursor: 'pointer', padding: '6px 12px', border: 'none', backgroundColor: filter === f ? 'var(--accent-primary)' : 'var(--bg-secondary)', color: filter === f ? '#fff' : 'var(--text-secondary)' }}>
              {f}
            </button>
          ))}
          
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {["All", "Needs Revision", "Mastered"].map((f) => (
              <button key={`rev-${f}`} onClick={() => setRevisionFilter(f === "All" ? "All" : f)} className="badge" style={{ cursor: 'pointer', padding: '6px 12px', border: 'none', backgroundColor: (revisionFilter === f || (f==="All" && revisionFilter==="All")) ? 'var(--text-primary)' : 'var(--bg-secondary)', color: (revisionFilter === f || (f==="All" && revisionFilter==="All")) ? '#fff' : 'var(--text-secondary)' }}>
                {f === "All" ? "All Revision" : f}
              </button>
            ))}
          </div>
        </div>

        <div className="dsa-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <AnimatePresence>
            {filteredProblems.map((problem) => (
              <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={`planner-task ${problem.solved ? "task-completed" : ""}`} style={{ backgroundColor: 'var(--bg-primary)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }} key={problem.id}>
                <div className="dsa-left flex-1" style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                  <button className="task-checkbox" style={{ marginTop: '2px' }} onClick={() => toggleSolved(problem.id)}>
                    {problem.solved ? <CheckCircle size={20} className="text-success" /> : <Circle size={20} className="text-muted" />}
                  </button>
                  <div className="flex-1">
                    <h3 className={`task-title ${problem.solved ? "muted-text strike-through" : ""}`} style={{ margin: '0 0 8px 0', fontSize: '16px' }}>
                      {problem.title}
                    </h3>
                    <div className="task-details flex items-center flex-wrap" style={{ gap: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                      {problem.problemNumber && <span>#{problem.problemNumber}</span>}
                      <span className="flex items-center gap-xs" style={{ display: 'flex', gap: '4px' }}><BookOpen size={14}/> {problem.topic}</span>
                      <span className={getDifficultyBadge(problem.difficulty)}>{problem.difficulty}</span>
                      <span className="badge">{problem.platform}</span>
                    </div>
                    {problem.notes && (
                      <p className="problem-notes" style={{ marginTop: '12px', fontSize: '14px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                        "{problem.notes}"
                      </p>
                    )}
                    {problem.problemLink && (
                      <a href={problem.problemLink} target="_blank" rel="noreferrer" className="problem-link flex items-center gap-xs" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '12px', color: 'var(--accent-primary)', textDecoration: 'none', fontSize: '13px', fontWeight: '500' }}>
                        <ExternalLink size={14} /> Open Problem
                      </a>
                    )}
                  </div>
                </div>

                <div className="revision-control" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                  <span className={getRevisionBadge(problem.revisionStatus || "Not Started")}>
                    {problem.revisionStatus || "Not Started"}
                  </span>
                  <select className="input-field" style={{ padding: '6px 10px', width: 'auto', minWidth: '140px', fontSize: '13px' }} value={problem.revisionStatus || "Not Started"} onChange={(e) => updateRevisionStatus(problem.id, e.target.value)}>
                    <option value="Not Started">Not Started</option>
                    <option value="Needs Revision">Needs Revision</option>
                    <option value="Mastered">Mastered</option>
                  </select>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}
export default DSA;