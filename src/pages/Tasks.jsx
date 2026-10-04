import { useEffect, useState } from "react";
import { isOverdue } from "../utils/date";
import { getStorage, setStorage } from "../utils/storage";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Calendar, CheckCircle, Circle, Edit3, Folder, AlertCircle } from "lucide-react";

const TASK_CATEGORIES = [
  "General",
  "DSA",
  "Development",
  "College",
  "Project",
  "Career",
  "Personal",
];

function getPriorityBadge(priority) {
  switch (priority) {
    case "High": return "badge badge-danger";
    case "Medium": return "badge badge-warning";
    case "Low": return "badge badge-info";
    default: return "badge";
  }
}

function Tasks() {
  const [tasks, setTasks] = useState(() => getStorage("tasks"));
  const [filter, setFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");

  const [taskText, setTaskText] = useState("");
  const [category, setCategory] = useState("General");
  const [priority, setPriority] = useState("Medium");
  const [dueDate, setDueDate] = useState("");
  const [editingTaskId, setEditingTaskId] = useState(null);

  useEffect(() => {
    setStorage("tasks", tasks);
  }, [tasks]);

  function handleEditTask(task) {
    setTaskText(task.text);
    setCategory(task.category || "General");
    setPriority(task.priority);
    setDueDate(task.dueDate || "");
    setEditingTaskId(task.id);
  }

  function addTask(event) {
    event.preventDefault();
    if (taskText.trim() === "") return;

    if (editingTaskId !== null) {
      setTasks((currentTasks) =>
        currentTasks.map((task) =>
          task.id === editingTaskId
            ? { ...task, text: taskText.trim(), category, priority, dueDate }
            : task
        )
      );
      setEditingTaskId(null);
    } else {
      setTasks((currentTasks) => [
        ...currentTasks,
        {
          id: Date.now(),
          text: taskText.trim(),
          category,
          priority,
          dueDate,
          completed: false,
        },
      ]);
    }

    setTaskText("");
    setCategory("General");
    setPriority("Medium");
    setDueDate("");
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

  const renderTask = (task) => {
    const overdue = isOverdue(task);
    return (
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
          >
            {task.completed ? <CheckCircle size={20} className="text-success" /> : <Circle size={20} className="text-muted" />}
          </button>

          <div className="task-content flex-1">
            <span className={`task-title ${task.completed ? "muted-text strike-through" : ""}`}>
              {task.text}
            </span>
            <div className="task-date muted-text flex items-center gap-xs" style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              <span className="flex items-center gap-xs" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Folder size={12} /> {task.category || "General"}
              </span>
              {task.dueDate && (
                <span className={`flex items-center gap-xs ${overdue ? "text-danger font-medium" : ""}`} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {overdue ? <AlertCircle size={12} /> : <Calendar size={12} />}
                  {overdue ? "Overdue" : "Due"} {task.dueDate}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="planner-task-actions">
          <span className={getPriorityBadge(task.priority)}>
            {task.priority}
          </span>
          <button
            type="button"
            className="icon-button edit-button"
            onClick={() => handleEditTask(task)}
            aria-label="Edit task"
          >
            <Edit3 size={16} />
          </button>
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
  };

  return (
    <main className="dashboard">
      <div className="dashboard-header">
        <h2>Tasks</h2>
        <p className="page-description">Manage everything you need to do.</p>
      </div>

      <div className="dashboard-grid">
        <div className="stat-card">
          <span className="stat-card-title">Total</span>
          <strong className="stat-card-value">{totalTasks}</strong>
        </div>
        <div className="stat-card">
          <span className="stat-card-title">Pending</span>
          <strong className="stat-card-value">{pendingTaskCount}</strong>
        </div>
        <div className="stat-card">
          <span className="stat-card-title">Completed</span>
          <strong className="stat-card-value">{completedTasks}</strong>
        </div>
        <div className="stat-card">
          <span className="stat-card-title">High Priority</span>
          <strong className="stat-card-value">{highPriorityCount}</strong>
        </div>
        <div className="stat-card">
          <span className="stat-card-title">Overdue</span>
          <strong className="stat-card-value">{overdueCount}</strong>
        </div>
      </div>

      <form className="planner-form card" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end' }} onSubmit={addTask}>
        <div className="form-group flex-1" style={{ minWidth: '200px' }}>
          <label className="muted-text" style={{ display: 'block', marginBottom: '6px', fontSize: '13px' }}>Task Description</label>
          <input
            type="text"
            className="input-field"
            placeholder="What needs to be done?"
            value={taskText}
            onChange={(e) => setTaskText(e.target.value)}
          />
        </div>
        
        <div className="form-group">
          <label className="muted-text" style={{ display: 'block', marginBottom: '6px', fontSize: '13px' }}>Priority</label>
          <select
            className="input-field"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </div>

        <div className="form-group">
          <label className="muted-text" style={{ display: 'block', marginBottom: '6px', fontSize: '13px' }}>Category</label>
          <select
            className="input-field"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {TASK_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="muted-text" style={{ display: 'block', marginBottom: '6px', fontSize: '13px' }}>Due Date</label>
          <input
            type="date"
            className="input-field"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>

        <div className="form-group" style={{ display: 'flex', gap: '10px' }}>
          <button type="submit" className="btn-primary">
            {editingTaskId !== null ? "Update Task" : "Add Task"}
          </button>
          
          {editingTaskId !== null && (
            <button
              type="button"
              className="btn-primary"
              style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
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
        </div>
      </form>

      <div className="planner-section card" style={{ padding: '24px' }}>
        <div className="task-filters" style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
          {["All", "Pending", "Completed", "High Priority"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="badge"
              style={{ 
                cursor: 'pointer', 
                padding: '6px 12px',
                border: 'none',
                backgroundColor: filter === f ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                color: filter === f ? '#fff' : 'var(--text-secondary)'
              }}
            >
              {f}
            </button>
          ))}
          
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px' }}>
            <select
              className="input-field"
              style={{ width: '140px', padding: '6px 10px', height: '100%' }}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="All">All Categories</option>
              {TASK_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>

            <select
              className="input-field"
              style={{ width: '130px', padding: '6px 10px', height: '100%' }}
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
          <div className="empty-state">
            <p>No tasks yet. Add your first task above.</p>
          </div>
        ) : sortedTasks.length === 0 ? (
          <div className="empty-state">
            <p>No tasks match your filters.</p>
          </div>
        ) : (
          <div className="planner-task-list" style={{ marginTop: '0' }}>
            <AnimatePresence>
              {sortedTasks.map(renderTask)}
            </AnimatePresence>
          </div>
        )}
      </div>
    </main>
  );
}

export default Tasks;