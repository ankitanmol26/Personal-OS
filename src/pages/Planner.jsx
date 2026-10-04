import { useEffect, useState } from "react";
import {
  getStorage,
  setStorage,
} from "../utils/storage";

function Planner() {
  const [tasks, setTasks] = useState(() => {
    return getStorage("plannerTasks");
  });

  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [priority, setPriority] = useState("Medium");

  useEffect(() => {
    setStorage("plannerTasks", tasks);
  }, [tasks]);

  function addTask(event) {
    event.preventDefault();

    if (title.trim() === "" || date === "") {
      return;
    }

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
        task.id === id
          ? {
              ...task,
              completed: !task.completed,
            }
          : task
      )
    );
  }

  function deleteTask(id) {
    setTasks(
      tasks.filter((task) => task.id !== id)
    );
  }

  const today = new Date()
    .toISOString()
    .split("T")[0];

  const overdueTasks = tasks.filter(
    (task) =>
      task.date < today &&
      !task.completed
  );

  const upcomingTasks = tasks.filter(
    (task) =>
      task.date > today &&
      !task.completed
  );

  const todayTasks = tasks.filter(
    (task) => task.date === today
  );

  const completedToday = todayTasks.filter(
    (task) => task.completed
  ).length;

  const todayProgress =
    todayTasks.length === 0
      ? 0
      : Math.round(
          (completedToday / todayTasks.length) * 100
        );

  return (
    <main className="dashboard">

      <h2>Planner</h2>

      <p className="page-description">
        Plan and manage your daily work.
      </p>

      {/* Summary */}

      <div className="planner-summary">

        <div className="planner-summary-card">
          <span>Today's Tasks</span>
          <strong>{todayTasks.length}</strong>
        </div>

        <div className="planner-summary-card">
          <span>Completed</span>
          <strong>{completedToday}</strong>
        </div>

        <div className="planner-summary-card">
          <span>Remaining</span>
          <strong>
            {todayTasks.length - completedToday}
          </strong>
        </div>

        <div className="planner-summary-card">
          <span>Overdue</span>
          <strong>{overdueTasks.length}</strong>
        </div>

        <div className="planner-summary-card">
          <span>Upcoming</span>
          <strong>{upcomingTasks.length}</strong>
        </div>

      </div>

      <div className="planner-progress">

        <div className="progress-header">
          <span>Today's Progress</span>
          <span>{todayProgress}%</span>
        </div>

        <div className="progress-bar">

          <div
            className="progress-fill"
            style={{
              width: `${todayProgress}%`,
            }}
          />

        </div>

      </div>

      {/* Add Task */}

      <form
        className="planner-form"
        onSubmit={addTask}
      >

        <input
          type="text"
          placeholder="What do you need to do?"
          value={title}
          onChange={(event) =>
            setTitle(event.target.value)
          }
        />

        <input
          type="date"
          value={date}
          onChange={(event) =>
            setDate(event.target.value)
          }
        />

        <select
          value={priority}
          onChange={(event) =>
            setPriority(event.target.value)
          }
        >
          <option>Low</option>
          <option>Medium</option>
          <option>High</option>
        </select>

        <button type="submit">
          Add Task
        </button>

      </form>

      <section className="planner-section">

        <h3>Overdue</h3>

        {overdueTasks.length === 0 ? (
          <p className="empty-message">
            No overdue tasks.
          </p>
        ) : (
          <div className="planner-task-list">

            {overdueTasks.map((task) => (
              <div
                className="planner-task"
                key={task.id}
              >

                <div className="planner-task-main">

                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() =>
                      toggleTask(task.id)
                    }
                  />

                  <div>
                    <span>
                      {task.title}
                    </span>

                    <small>
                      Due: {task.date}
                    </small>
                  </div>

                </div>

                <div className="planner-task-actions">

                  <span>
                    {task.priority}
                  </span>

                  <button
                    type="button"
                    className="delete-button"
                    onClick={() =>
                      deleteTask(task.id)
                    }
                  >
                    Delete
                  </button>

                </div>

              </div>
            ))}

          </div>
        )}

      </section>

      {/* Today's Tasks */}

      <section className="planner-section">

        <h3>Today's Tasks</h3>

        {todayTasks.length === 0 ? (
          <p className="empty-message">
            No tasks planned for today.
          </p>
        ) : (
          <div className="planner-task-list">

            {todayTasks.map((task) => (
              <div
                className="planner-task"
                key={task.id}
              >

                <div className="planner-task-main">

                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() =>
                      toggleTask(task.id)
                    }
                  />

                  <span
                    className={
                      task.completed
                        ? "completed-task"
                        : ""
                    }
                  >
                    {task.title}
                  </span>

                </div>

                <div className="planner-task-actions">

                  <span>
                    {task.priority}
                  </span>

                  <button
                    type="button"
                    className="delete-button"
                    onClick={() =>
                      deleteTask(task.id)
                    }
                  >
                    Delete
                  </button>

                </div>

              </div>
            ))}

          </div>
        )}

      </section>

      <section className="planner-section">

        <h3>Upcoming</h3>

        {upcomingTasks.length === 0 ? (
          <p className="empty-message">
            No upcoming tasks.
          </p>
        ) : (
          <div className="planner-task-list">

            {upcomingTasks
              .sort((a, b) =>
                a.date.localeCompare(b.date)
              )
              .map((task) => (
                <div
                  className="planner-task"
                  key={task.id}
                >

                  <div className="planner-task-main">

                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() =>
                        toggleTask(task.id)
                      }
                    />

                    <div>

                      <span>
                        {task.title}
                      </span>

                      <small>
                        Due: {task.date}
                      </small>

                    </div>

                  </div>

                  <div className="planner-task-actions">

                    <span>
                      {task.priority}
                    </span>

                    <button
                      type="button"
                      className="delete-button"
                      onClick={() =>
                        deleteTask(task.id)
                      }
                    >
                      Delete
                    </button>

                  </div>

                </div>
              ))}

          </div>
        )}

      </section>

    </main>
  );
}

export default Planner;