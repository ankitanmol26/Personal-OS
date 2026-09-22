import { useEffect, useState } from "react";

function Tasks() {
  const [tasks, setTasks] = useState(() => {
  const savedTasks = localStorage.getItem("tasks");

  return savedTasks
    ? JSON.parse(savedTasks)
    : [];
});
useEffect(() => {
  localStorage.setItem(
    "tasks",
    JSON.stringify(tasks)
  );
}, [tasks]);
  const [filter, setFilter] = useState("All");

  const [taskText, setTaskText] = useState("");
  const [category, setCategory] = useState("College");
  const [priority, setPriority] = useState("Medium");
  const [dueDate, setDueDate] = useState("");

  function addTask(event) {
    event.preventDefault();

    if (taskText.trim() === "") {
      return;
    }

    const newTask = {
      id: Date.now(),
      text: taskText,
      category: category,
      priority: priority,
      dueDate: dueDate,
      completed: false,
    };

    setTasks([...tasks, newTask]);

    setTaskText("");
    setCategory("College");
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

  if (filter === "Pending") {
    return !task.completed;
  }

  if (filter === "Completed") {
    return task.completed;
  }

  if (filter === "High Priority") {
    return task.priority === "High" && !task.completed;
  }

  return true;
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

  function deleteTask(id) {
    setTasks(
      tasks.filter((task) => task.id !== id)
    );
  }
  const totalTasks = tasks.length;

const completedTasks = tasks.filter(
  (task) => task.completed
).length;

const pendingTasks = tasks.filter(
  (task) => !task.completed
).length;

const highPriorityTasks = tasks.filter(
  (task) => task.priority === "High" && !task.completed
).length;

  return (
    <main className="dashboard">

      <h2>Tasks</h2>

      <p className="page-description">
        Manage everything you need to do.
      </p>
      <div className="task-stats">

  <div className="stat-card">
    <h3>{totalTasks}</h3>
    <p>Total</p>
  </div>

  <div className="stat-card">
    <h3>{completedTasks}</h3>
    <p>Completed</p>
  </div>

  <div className="stat-card">
    <h3>{pendingTasks}</h3>
    <p>Pending</p>
  </div>

  <div className="stat-card">
    <h3>{highPriorityTasks}</h3>
    <p>High Priority</p>
  </div>

</div>

      <form className="task-form" onSubmit={addTask}>

        <input
          type="text"
          placeholder="What needs to be done?"
          value={taskText}
          onChange={(event) => setTaskText(event.target.value)}
        />

        <select
          value={category}
          onChange={(event) => setCategory(event.target.value)}
        >
          <option value="DSA">DSA</option>
          <option value="College">College</option>
          <option value="Project">Project</option>
          <option value="Personal">Personal</option>
        </select>

        <select
          value={priority}
          onChange={(event) => setPriority(event.target.value)}
        >
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
        </select>

        <input
          type="date"
          value={dueDate}
          onChange={(event) => setDueDate(event.target.value)}
        />

        <button type="submit">
          Add Task
        </button>

      </form>
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
      <div className="task-list">

        {tasks.length === 0 ? (

          <p className="empty-message">
            No tasks yet. Add your first task.
          </p>

        ) : (

          sortedTasks.map((task) => {
            const today = new Date()
              .toISOString()
              .split("T")[0];

            const isOverdue =
              task.dueDate &&
              task.dueDate < today &&
              !task.completed;

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

                    <span>
                      {task.category}
                    </span>

                    <span>
                      {task.priority}
                    </span>

                    {task.dueDate && (
                      <span>
                        Due: {task.dueDate}

                        {isOverdue && (
                          <span className="overdue-label">
                            Overdue
                          </span>
                        )}
                      </span>
                    )}

                  </div>

                </div>

              </div>

              <button
                className="delete-button"
                onClick={() => deleteTask(task.id)}
              >
                Delete
              </button>

            </div>

            );
          })

        )}

      </div>

    </main>
  );
}

export default Tasks;