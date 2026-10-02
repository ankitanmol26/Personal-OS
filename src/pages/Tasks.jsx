import { useEffect, useState } from "react";
import { isOverdue } from "../utils/date";
import {
  getStorage,
  setStorage,
} from "../utils/storage";

const TASK_CATEGORIES = [
  "General",
  "DSA",
  "Development",
  "College",
  "Project",
  "Career",
  "Personal",
];

function Tasks() {
  const [tasks, setTasks] = useState(() => {
    return getStorage("tasks");
  });

  useEffect(() => {
    setStorage("tasks", tasks);
  }, [tasks]);
  const [filter, setFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");

  const [taskText, setTaskText] = useState("");
  const [category, setCategory] = useState("General");
  const [priority, setPriority] = useState("Medium");
  const [dueDate, setDueDate] = useState("");
  const [editingTaskId, setEditingTaskId] = useState(null);

  function handleEditTask(task) {
    setTaskText(task.text);
    setCategory(task.category || "General");
    setPriority(task.priority);
    setDueDate(task.dueDate || "");
    setEditingTaskId(task.id);
  }

  function addTask(event) {
    event.preventDefault();

    if (taskText.trim() === "") {
      return;
    }

    if (editingTaskId !== null) {
      setTasks((currentTasks) =>
        currentTasks.map((task) =>
          task.id === editingTaskId
            ? {
                ...task,
                text: taskText.trim(),
                category,
                priority,
                dueDate,
              }
            : task
        )
      );

      setEditingTaskId(null);
    } else {
      const newTask = {
        id: Date.now(),
        text: taskText.trim(),
        category,
        priority,
        dueDate,
        completed: false,
      };

      setTasks((currentTasks) => [
        ...currentTasks,
        newTask,
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
        task.id === id
          ? { ...task, completed: !task.completed }
          : task
      )
    );
  }
  const filteredTasks = tasks.filter((task) => {
    const matchesCategory =
      categoryFilter === "All" ||
      (task.category || "General") === categoryFilter;

    let matchesStatus = true;

    if (filter === "Pending") {
      matchesStatus = !task.completed;
    } else if (filter === "Completed") {
      matchesStatus = task.completed;
    } else if (filter === "High Priority") {
      matchesStatus = task.priority === "High" && !task.completed;
    }

    const matchesPriority =
      priorityFilter === "All" ||
      task.priority === priorityFilter;

    return matchesStatus && matchesCategory && matchesPriority;
  });
const sortedTasks = [...filteredTasks].sort(
  (a, b) => {

    // Completed tasks go to the bottom
    if (a.completed && !b.completed) {
      return 1;
    }

    if (!a.completed && b.completed) {
      return -1;
    }

    // Tasks without due dates go after tasks with due dates
    if (!a.dueDate && b.dueDate) {
      return 1;
    }

    if (a.dueDate && !b.dueDate) {
      return -1;
    }

    // Earlier due date comes first
    if (a.dueDate && b.dueDate) {
      return a.dueDate.localeCompare(b.dueDate);
    }

    return 0;
  }
  );

  const totalTasks = tasks.length;

  const completedTasks = tasks.filter(
    (task) => task.completed
  ).length;

  const pendingTaskCount =
    totalTasks - completedTasks;

  const highPriorityCount = tasks.filter(
    (task) =>
      !task.completed &&
      task.priority === "High"
  ).length;

  const overdueCount = tasks.filter(
    (task) => isOverdue(task)
  ).length;

  function deleteTask(id) {
    setTasks(
      tasks.filter((task) => task.id !== id)
    );
  }


  return (
    <main className="dashboard">

      <h2>Tasks</h2>

      <p className="page-description">
        Manage everything you need to do.
      </p>

      <form className="task-form" onSubmit={addTask}>

        <input
          type="text"
          placeholder="What needs to be done?"
          value={taskText}
          onChange={(event) => setTaskText(event.target.value)}
        />

        <select
          value={priority}
          onChange={(event) => setPriority(event.target.value)}
        >
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
        </select>

        <div className="form-group">
          <label htmlFor="task-category">
            Category
          </label>
          <select
            id="task-category"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            {TASK_CATEGORIES.map((taskCategory) => (
              <option key={taskCategory} value={taskCategory}>
                {taskCategory}
              </option>
            ))}
          </select>
        </div>

        <input
          type="date"
          value={dueDate}
          onChange={(event) => setDueDate(event.target.value)}
        />

        <button type="submit">
          {editingTaskId !== null ? "Update Task" : "Add Task"}
        </button>

        {editingTaskId !== null && (
          <button
            type="button"
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

      </form>
      <div className="task-summary">
        <div className="task-summary-card">
          <span>Total</span>
          <strong>{totalTasks}</strong>
        </div>
        <div className="task-summary-card">
          <span>Pending</span>
          <strong>{pendingTaskCount}</strong>
        </div>
        <div className="task-summary-card">
          <span>Completed</span>
          <strong>{completedTasks}</strong>
        </div>
        <div className="task-summary-card">
          <span>High Priority</span>
          <strong>{highPriorityCount}</strong>
        </div>
        <div className="task-summary-card">
          <span>Overdue</span>
          <strong>{overdueCount}</strong>
        </div>
      </div>

      <div className="task-filters">

  <button
    onClick={() => setFilter("All")}
    className={filter === "All" ? "active-filter" : ""}
  >
    All
  </button>

  <button
    onClick={() => setFilter("Pending")}
    className={filter === "Pending" ? "active-filter" : ""}
  >
    Pending
  </button>

  <button
    onClick={() => setFilter("Completed")}
    className={filter === "Completed" ? "active-filter" : ""}
  >
    Completed
  </button>

  <button
    onClick={() => setFilter("High Priority")}
    className={filter === "High Priority" ? "active-filter" : ""}
  >
    High Priority
  </button>

</div>
      <div className="task-filters">
        <div className="task-filter">
          <label htmlFor="category-filter">
            Category
          </label>
          <select
            id="category-filter"
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
          >
            <option value="All">All</option>
            {TASK_CATEGORIES.map((taskCategory) => (
              <option key={taskCategory} value={taskCategory}>
                {taskCategory}
              </option>
            ))}
          </select>
        </div>
        <div className="task-filter">
          <label htmlFor="priority-filter">
            Priority
          </label>
          <select
            id="priority-filter"
            value={priorityFilter}
            onChange={(event) => setPriorityFilter(event.target.value)}
          >
            <option value="All">All</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>
      <div className="task-list">

        {tasks.length === 0 ? (

          <p className="empty-message">
            No tasks yet. Add your first task.
          </p>

        ) : (

          sortedTasks.map((task) => {
            const overdue = isOverdue(task);

            return (

            <div className="task-item" key={task.id}>

              <div className="task-left">

                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => toggleTask(task.id)}
                />

                <div>

                  <span
                    className={
                      task.completed
                        ? "completed-task"
                        : ""
                    }
                  >
                    {task.text}
                  </span>

                  <div className="task-details">

                    <span className="task-category">
                      {task.category || "General"}
                    </span>

                    <span>
                      {task.priority}
                    </span>

                    {task.dueDate && (
                      <span className={overdue ? "task-overdue" : ""}>
                        {overdue
                          ? `Overdue • ${task.dueDate}`
                          : `Due • ${task.dueDate}`}
                      </span>
                    )}

                  </div>

                </div>

              </div>

              <div className="task-actions">
                <button
                  type="button"
                  className="edit-button"
                  onClick={() => handleEditTask(task)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="delete-button"
                  onClick={() => deleteTask(task.id)}
                >
                  Delete
                </button>
              </div>

            </div>

            );
          })

        )}

      </div>

    </main>
  );
}

export default Tasks;