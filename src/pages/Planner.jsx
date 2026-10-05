import { useEffect, useState } from "react";
import { getStorage, setStorage } from "../utils/storage";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Calendar, CheckCircle2, Circle, ArrowRight, Check } from "lucide-react";
import "./Planner.css";

function StatCard({ label, value, type, delay = 0 }) {
  const indicatorColor = {
    accent: "var(--accent-primary)",
    info: "var(--status-info)",
    success: "var(--status-success)",
    danger: "var(--status-danger)",
    neutral: "var(--text-muted)",
  }[type] || "var(--text-muted)";

  return (
    <motion.div 
      className="planner-stat-card"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: delay * 0.04, ease: "easeOut" }}
    >
      <div className="planner-stat-title">
        {label}
        <span className="planner-stat-indicator" style={{ backgroundColor: indicatorColor }} />
      </div>
      <div className="planner-stat-value">{value}</div>
    </motion.div>
  );
}

function Planner() {
  const [tasks, setTasks] = useState(() => getStorage("plannerTasks"));
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [priority, setPriority] = useState("Medium");

  useEffect(() => {
    setStorage("plannerTasks", tasks);
  }, [tasks]);

  function addTask(event) {
    event.preventDefault();
    if (title.trim() === "" || date === "") return;

    const newTask = {
      id: Date.now(),
      title: title,
      date: date,
      priority: priority,
      completed: false,
    };

    setTasks([...tasks, newTask]);
    setTitle("");
    setDate("");
    setPriority("Medium");
  }

  function toggleTask(id) {
    setTasks(
      tasks.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  }

  function deleteTask(id) {
    setTasks(tasks.filter((task) => task.id !== id));
  }

  const today = new Date().toISOString().split("T")[0];
  const overdueTasks = tasks.filter((task) => task.date < today && !task.completed);
  const upcomingTasks = tasks.filter((task) => task.date > today && !task.completed);
  const todayTasks = tasks.filter((task) => task.date === today);
  const completedToday = todayTasks.filter((task) => task.completed).length;
  const todayProgress = todayTasks.length === 0 ? 0 : Math.round((completedToday / todayTasks.length) * 100);

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return isNaN(d) ? dateStr : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const renderTask = (task, index) => (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, height: 0, overflow: 'hidden', padding: 0, margin: 0, border: 'none' }}
      transition={{ duration: 0.2, delay: index * 0.04 }}
      className={`planner-task-card ${task.completed ? "completed" : ""}`}
      key={task.id}
    >
      <button 
        className={`planner-task-checkbox ${task.completed ? "checked" : ""}`} 
        onClick={() => toggleTask(task.id)}
        aria-label={task.completed ? "Mark incomplete" : "Mark complete"}
      >
        <AnimatePresence mode="wait">
          {task.completed ? (
            <motion.div
              key="check"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <CheckCircle2 size={22} />
            </motion.div>
          ) : (
            <motion.div
              key="circle"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Circle size={22} />
            </motion.div>
          )}
        </AnimatePresence>
      </button>

      <div className="planner-task-content">
        <span className="planner-task-title">{task.title}</span>
        <span className="planner-task-date">
          <Calendar size={12} /> {task.date === today ? "Today" : formatDate(task.date)}
        </span>
      </div>

      <div className="planner-task-actions">
        <span className={`planner-task-badge ${task.priority.toLowerCase()}`}>
          {task.priority}
        </span>
        <button
          type="button"
          className="planner-task-delete"
          onClick={() => deleteTask(task.id)}
          aria-label="Delete task"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </motion.div>
  );

  return (
    <main className="planner-page">
      <div className="planner-header">
        <h2>PLANNER</h2>
        <p>Plan and manage your daily work.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
        <div className="planner-stats-grid">
          <StatCard label="Today" value={todayTasks.length} type="accent" delay={0} />
          <StatCard label="Completed" value={completedToday} type="success" delay={1} />
          <StatCard label="Remaining" value={todayTasks.length - completedToday} type="neutral" delay={2} />
        </div>
        <div className="planner-stats-secondary">
          <StatCard label="Overdue" value={overdueTasks.length} type="danger" delay={3} />
          <StatCard label="Upcoming" value={upcomingTasks.length} type="info" delay={4} />
        </div>
      </div>

      <div className="planner-progress-card">
        <div className="planner-progress-header">
          <span className="planner-progress-title">Today's Progress</span>
          <span className="planner-progress-value">{todayProgress}%</span>
        </div>
        <p className="planner-progress-subtitle">{completedToday} of {todayTasks.length} tasks completed</p>
        <div className="planner-progress-track">
          <motion.div
            className="planner-progress-fill"
            initial={{ width: "0%" }}
            animate={{ width: `${todayProgress}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
      </div>

      <form className="planner-form-card" onSubmit={addTask}>
        <span className="planner-form-title">What needs to be done?</span>
        <div className="planner-form-inputs">
          <input
            type="text"
            className="planner-input"
            placeholder="e.g. Complete Spring Boot revision..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <input
            type="date"
            className="planner-input"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <select
            className="planner-input"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
          </select>
          <button type="submit" className="planner-btn-submit">
            Add Task <ArrowRight size={16} style={{ marginLeft: '6px' }} />
          </button>
        </div>
      </form>

      {/* OVERDUE */}
      <section className="planner-section overdue">
        <div className="planner-section-header">
          <h3 className="planner-section-title">
            Overdue
            {overdueTasks.length > 0 && <span className="planner-section-count">{overdueTasks.length}</span>}
          </h3>
        </div>
        {overdueTasks.length === 0 ? (
          <div className="planner-empty-state success">
            <Check size={18} />
            You're all caught up. No overdue tasks.
          </div>
        ) : (
          <div className="planner-task-list">
            <AnimatePresence>
              {overdueTasks.map((task, i) => renderTask(task, i))}
            </AnimatePresence>
          </div>
        )}
      </section>

      {/* TODAY'S TASKS */}
      <section className="planner-section">
        <div className="planner-section-header">
          <h3 className="planner-section-title">
            Today's Tasks
            {todayTasks.length > 0 && <span className="planner-section-count">{todayTasks.length}</span>}
          </h3>
        </div>
        {todayTasks.length === 0 ? (
          <div className="planner-empty-state">
            No tasks planned for today.
          </div>
        ) : (
          <div className="planner-task-list">
            <AnimatePresence>
              {todayTasks.map((task, i) => renderTask(task, i))}
            </AnimatePresence>
          </div>
        )}
      </section>

      {/* UPCOMING */}
      <section className="planner-section">
        <div className="planner-section-header">
          <h3 className="planner-section-title">
            Upcoming
            {upcomingTasks.length > 0 && <span className="planner-section-count">{upcomingTasks.length}</span>}
          </h3>
        </div>
        {upcomingTasks.length === 0 ? (
          <div className="planner-empty-state">
            No upcoming tasks.
          </div>
        ) : (
          <div className="planner-task-list">
            <AnimatePresence>
              {upcomingTasks.sort((a, b) => a.date.localeCompare(b.date)).map((task, i) => renderTask(task, i))}
            </AnimatePresence>
          </div>
        )}
      </section>
    </main>
  );
}

export default Planner;