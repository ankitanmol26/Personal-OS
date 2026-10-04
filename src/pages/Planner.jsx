import { useEffect, useState } from "react";
import { getStorage, setStorage } from "../utils/storage";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Calendar, CheckCircle, Circle } from "lucide-react";

function getPriorityBadge(priority) {
  switch (priority) {
    case "High": return "badge badge-danger";
    case "Medium": return "badge badge-warning";
    case "Low": return "badge badge-info";
    default: return "badge";
  }
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

  const renderTask = (task) => (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`planner-task card ${task.completed ? "task-completed" : ""}`}
      key={task.id}
    >
      <div className="planner-task-main">
        <button 
          className="task-checkbox" 
          onClick={() => toggleTask(task.id)}
          aria-label={task.completed ? "Mark incomplete" : "Mark complete"}
        >
          {task.completed ? <CheckCircle size={20} className="text-success" /> : <Circle size={20} className="text-muted" />}
        </button>

        <div className="task-content flex-1">
          <span className={`task-title ${task.completed ? "muted-text strike-through" : ""}`}>
            {task.title}
          </span>
          <small className="task-date muted-text flex items-center gap-xs">
            <Calendar size={12} /> {task.date}
          </small>
        </div>
      </div>

      <div className="planner-task-actions">
        <span className={getPriorityBadge(task.priority)}>
          {task.priority}
        </span>
        <button
          type="button"
          className="icon-button delete-button"
          onClick={() => deleteTask(task.id)}
          aria-label="Delete task"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </motion.div>
  );

  return (
    <main className="dashboard">
      <div className="dashboard-header">
        <h2>Planner</h2>
        <p className="page-description">Plan and manage your daily work.</p>
      </div>

      <div className="dashboard-grid">
        <div className="stat-card">
          <span className="stat-card-title">Today's Tasks</span>
          <strong className="stat-card-value">{todayTasks.length}</strong>
        </div>
        <div className="stat-card">
          <span className="stat-card-title">Completed</span>
          <strong className="stat-card-value">{completedToday}</strong>
        </div>
        <div className="stat-card">
          <span className="stat-card-title">Remaining</span>
          <strong className="stat-card-value">{todayTasks.length - completedToday}</strong>
        </div>
        <div className="stat-card">
          <span className="stat-card-title">Overdue</span>
          <strong className="stat-card-value">{overdueTasks.length}</strong>
        </div>
        <div className="stat-card">
          <span className="stat-card-title">Upcoming</span>
          <strong className="stat-card-value">{upcomingTasks.length}</strong>
        </div>
      </div>

      <div className="progress-card card">
        <div className="progress-header">
          <div>
            <h3>Today's Progress</h3>
          </div>
          <strong>{todayProgress}%</strong>
        </div>
        <div className="progress-bar">
          <motion.div
            className="progress-fill"
            initial={{ width: "0%" }}
            animate={{ width: `${todayProgress}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
      </div>

      <form className="planner-form card" onSubmit={addTask}>
        <div className="form-group flex-1">
          <input
            type="text"
            className="input-field"
            placeholder="What do you need to do?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="form-group">
          <input
            type="date"
            className="input-field"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div className="form-group">
          <select
            className="input-field"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
          </select>
        </div>
        <button type="submit" className="btn-primary">
          Add Task
        </button>
      </form>

      <section className="planner-section">
        <div className="section-heading">
          <h3>Overdue</h3>
        </div>
        {overdueTasks.length === 0 ? (
          <div className="empty-state">
            <p>No overdue tasks. Great job!</p>
          </div>
        ) : (
          <div className="planner-task-list">
            <AnimatePresence>
              {overdueTasks.map(renderTask)}
            </AnimatePresence>
          </div>
        )}
      </section>

      <section className="planner-section">
        <div className="section-heading">
          <h3>Today's Tasks</h3>
        </div>
        {todayTasks.length === 0 ? (
          <div className="empty-state">
            <p>No tasks planned for today.</p>
          </div>
        ) : (
          <div className="planner-task-list">
            <AnimatePresence>
              {todayTasks.map(renderTask)}
            </AnimatePresence>
          </div>
        )}
      </section>

      <section className="planner-section">
        <div className="section-heading">
          <h3>Upcoming</h3>
        </div>
        {upcomingTasks.length === 0 ? (
          <div className="empty-state">
            <p>No upcoming tasks.</p>
          </div>
        ) : (
          <div className="planner-task-list">
            <AnimatePresence>
              {upcomingTasks.sort((a, b) => a.date.localeCompare(b.date)).map(renderTask)}
            </AnimatePresence>
          </div>
        )}
      </section>
    </main>
  );
}

export default Planner;