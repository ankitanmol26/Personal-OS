import { useEffect, useState } from "react";
import { isOverdue } from "../utils/date";
import { getTasks, createTask, updateTask, deleteTask as apiDeleteTask } from "../services/taskService";
import { useApi } from "../hooks/useApi";
import { ApiError, ApiLoading } from "../components/ApiFeedback";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Calendar, CheckCircle, Circle, Edit3, Folder, AlertCircle } from "lucide-react";
import "./Tasks.css";

const TASK_CATEGORIES = [
  "General",
  "DSA",
  "Development",
  "College",
  "Project",
  "Career",
  "Personal",
];

function getPriorityClass(priority) {
  switch (priority) {
    case "High": return "task-priority high";
    case "Medium": return "task-priority medium";
    case "Low": return "task-priority low";
    default: return "task-priority";
  }
}

function StatCard({ label, value, type, delay = 0 }) {
  const indicatorColor = {
    accent: "var(--accent-primary)",
    info: "var(--status-info)",
    success: "var(--status-success)",
    warning: "var(--status-warning)",
    danger: "var(--status-danger)",
    neutral: "var(--text-muted)",
  }[type] || "var(--text-muted)";

  return (
    <motion.div 
      className="tasks-stat-card"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: delay * 0.04, ease: "easeOut" }}
    >
      <div className="tasks-stat-title">
        {label}
        <span className="tasks-stat-indicator" style={{ backgroundColor: indicatorColor }} />
      </div>
      <div className="tasks-stat-value">{value}</div>
    </motion.div>
  );
}

function Tasks() {
  const [tasks, setTasks] = useState([]);
  const { loading, error, setError, withApi, withApiLoading } = useApi(true);

  const [filter, setFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");

  const [taskText, setTaskText] = useState("");
  const [category, setCategory] = useState("General");
  const [priority, setPriority] = useState("Medium");
  const [dueDate, setDueDate] = useState("");
  const [editingTaskId, setEditingTaskId] = useState(null);

  useEffect(() => {
    fetchTasks();
  }, []);

  async function fetchTasks() {
    try {
      const data = await withApiLoading(() => getTasks(), "Failed to load tasks. Please ensure the backend is running.");
      setTasks(data);
    } catch (err) {
      // error handled by hook
    }
  }

  function handleEditTask(task) {
    setTaskText(task.text);
    setCategory(task.category || "General");
    setPriority(task.priority);
    setDueDate(task.dueDate || "");
    setEditingTaskId(task.id);
  }

  async function addTask(event) {
    event.preventDefault();
    if (taskText.trim() === "") return;

    const taskData = {
      text: taskText.trim(),
      category,
      priority,
      dueDate: dueDate || null,
      completed: false
    };

    try {
      if (editingTaskId !== null) {
        const taskToUpdate = tasks.find(t => t.id === editingTaskId);
        const updated = await withApi(() => updateTask(editingTaskId, { ...taskToUpdate, ...taskData, completed: taskToUpdate.completed }), "Failed to update task.");
        setTasks((currentTasks) =>
          currentTasks.map((task) =>
            task.id === editingTaskId ? updated : task
          )
        );
        setEditingTaskId(null);
      } else {
        const created = await withApi(() => createTask(taskData), "Failed to save task.");
        setTasks((currentTasks) => [...currentTasks, created]);
      }

      setTaskText("");
      setCategory("General");
      setPriority("Medium");
      setDueDate("");
    } catch (err) {
      // error handled by hook
    }
  }

  async function toggleTask(id) {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    try {
      const updated = await withApi(() => updateTask(id, { ...task, completed: !task.completed }), "Failed to update task status.");
      setTasks((currentTasks) =>
        currentTasks.map((t) => (t.id === id ? updated : t))
      );
    } catch (err) {
      // error handled
    }
  }

  async function handleDeleteTask(id) {
    try {
      await withApi(() => apiDeleteTask(id), "Failed to delete task.");
      setTasks((currentTasks) => currentTasks.filter((task) => task.id !== id));
    } catch (err) {
      // error handled
    }
  }

  const filteredTasks = tasks.filter((task) => {
    const matchesCategory = categoryFilter === "All" || (task.category || "General") === categoryFilter;
    let matchesStatus = true;
    if (filter === "Pending") matchesStatus = !task.completed;
    else if (filter === "Completed") matchesStatus = task.completed;
    else if (filter === "High Priority") matchesStatus = task.priority === "High" && !task.completed;
    
    const matchesPriority = priorityFilter === "All" || task.priority === priorityFilter;
    return matchesStatus && matchesCategory && matchesPriority;
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (a.completed && !b.completed) return 1;
    if (!a.completed && b.completed) return -1;
    if (!a.dueDate && b.dueDate) return 1;
    if (a.dueDate && !b.dueDate) return -1;
    if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
    return 0;
  });

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((task) => task.completed).length;
  const pendingTaskCount = totalTasks - completedTasks;
  const highPriorityCount = tasks.filter((task) => !task.completed && task.priority === "High").length;
  const overdueCount = tasks.filter((task) => isOverdue(task)).length;

  const renderTask = (task, index) => {
    const overdue = isOverdue(task);
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, height: 0, padding: 0, margin: 0, overflow: 'hidden', border: 'none' }}
        transition={{ duration: 0.2, delay: index * 0.03 }}
        className={`task-card ${task.completed ? "completed" : ""}`}
        key={task.id}
      >
        <button 
          className={`task-checkbox ${task.completed ? "checked" : ""}`} 
          onClick={() => toggleTask(task.id)}
          aria-label={task.completed ? "Mark incomplete" : "Mark complete"}
        >
          <AnimatePresence mode="wait">
            {task.completed ? (
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

        <div className="task-content">
          <h3 className="task-title">
            {task.text}
          </h3>
          <div className="task-meta">
            <span className="task-meta-item">
              <Folder size={14} /> {task.category || "General"}
            </span>
            {task.dueDate && (
              <span className={`task-meta-item ${overdue ? "overdue" : ""}`}>
                {overdue ? <AlertCircle size={14} /> : <Calendar size={14} />}
                {overdue ? "Overdue" : "Due"} {task.dueDate}
              </span>
            )}
          </div>
        </div>

        <div className="task-actions">
          <span className={getPriorityClass(task.priority)}>
            {task.priority}
          </span>
          <button
            type="button"
            className="task-btn-icon edit"
            onClick={() => handleEditTask(task)}
            aria-label="Edit task"
          >
            <Edit3 size={16} />
          </button>
          <button
            type="button"
            className="task-btn-icon delete"
            onClick={() => handleDeleteTask(task.id)}
            aria-label="Delete task"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </motion.div>
    );
  };

  return (
    <main className="tasks-page">
      <div className="tasks-header">
        <h2>Tasks</h2>
        <p>Manage everything you need to do.</p>
      </div>

      {error && (
        <ApiError error={error} onRetry={fetchTasks} />
      )}

      {loading && tasks.length === 0 ? (
        <ApiLoading message="Loading tasks..." />
      ) : (
        <>

      <div className="tasks-stats">
        <StatCard label="Total" value={totalTasks} type="neutral" delay={0} />
        <StatCard label="Pending" value={pendingTaskCount} type="info" delay={1} />
        <StatCard label="Completed" value={completedTasks} type="success" delay={2} />
        <StatCard label="High Priority" value={highPriorityCount} type="warning" delay={3} />
        <StatCard label="Overdue" value={overdueCount} type={overdueCount > 0 ? "danger" : "neutral"} delay={4} />
      </div>

      <AnimatePresence mode="wait">
        <motion.form 
          key={editingTaskId !== null ? "edit" : "add"}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.2 }}
          className="tasks-form" 
          onSubmit={addTask}
        >
          <h3 className="tasks-form-header">
            {editingTaskId !== null ? "Editing Task" : "Add Task"}
          </h3>
          <div className="tasks-form-grid">
            <div className="tasks-input-group desc">
              <label className="tasks-input-label">Task Description</label>
              <input
                type="text"
                className="tasks-input"
                placeholder="What needs to be done?"
                value={taskText}
                onChange={(e) => setTaskText(e.target.value)}
                required
              />
            </div>
            
            <div className="tasks-input-group pri">
              <label className="tasks-input-label">Priority</label>
              <select
                className="tasks-input"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>

            <div className="tasks-input-group cat">
              <label className="tasks-input-label">Category</label>
              <select
                className="tasks-input"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {TASK_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            
            <div className="tasks-input-group date">
              <label className="tasks-input-label">Due Date</label>
              <input
                type="date"
                className="tasks-input"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            <div className="tasks-input-group btns">
              {editingTaskId !== null && (
                <button
                  type="button"
                  className="tasks-btn-secondary"
                  onClick={() => {
                    setEditingTaskId(null);
                    setTaskText("");
                    setCategory("General");
                    setPriority("Medium");
                    setDueDate("");
                  }}
                >
                  Cancel
                </button>
              )}
              <button type="submit" className="tasks-btn-primary">
                {editingTaskId !== null ? "Update Task" : "Add Task →"}
              </button>
            </div>
          </div>
        </motion.form>
      </AnimatePresence>

      <div className="tasks-filters-section">
        <div className="tasks-filters-bar">
          <div className="tasks-filter-group">
            {["All", "Pending", "Completed", "High Priority"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`tasks-filter-pill ${filter === f ? 'active' : ''}`}
                type="button"
              >
                {f}
              </button>
            ))}
          </div>
          
          <div className="tasks-filter-group">
            <select
              className="tasks-filter-select"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="All">All Categories</option>
              {TASK_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>

            <select
              className="tasks-filter-select"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="All">All Priorities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>

        {tasks.length === 0 ? (
          <div className="tasks-empty">
            <span className="tasks-empty-title">No tasks yet</span>
            <span className="tasks-empty-desc">Add your first task above and start organizing your workload.</span>
          </div>
        ) : sortedTasks.length === 0 ? (
          <div className="tasks-empty">
            <span className="tasks-empty-title">No matching tasks</span>
            <span className="tasks-empty-desc">Try changing your filters.</span>
          </div>
        ) : (
          <div className="tasks-list">
            <AnimatePresence mode="popLayout">
              {sortedTasks.map((task, i) => renderTask(task, i))}
            </AnimatePresence>
          </div>
        )}
      </div>
      </>
      )}
    </main>
  );
}

export default Tasks;