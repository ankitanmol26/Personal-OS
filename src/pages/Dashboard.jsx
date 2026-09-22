import { useEffect, useState } from "react";

function Dashboard() {
  const [taskCount, setTaskCount] = useState(0);
  const [pendingTasks, setPendingTasks] = useState(0);

  const [dsaTotal, setDsaTotal] = useState(0);
  const [dsaSolved, setDsaSolved] = useState(0);

  const [projectCount, setProjectCount] = useState(0);
  const [noteCount, setNoteCount] = useState(0);
  const [pendingTaskList, setPendingTaskList] = useState([]);
const [unsolvedProblems, setUnsolvedProblems] = useState([]);
  function loadDashboardData() {
    // Tasks

    const savedTasks = localStorage.getItem("tasks");

    if (savedTasks) {
      const tasks = JSON.parse(savedTasks);

      setTaskCount(tasks.length);

      const pending = tasks.filter(
  (task) => !task.completed
);

setPendingTasks(pending.length);
setPendingTaskList(pending);
    } else {
      setTaskCount(0);
setPendingTasks(0);
setPendingTaskList([]);
    }

    // DSA

    const savedProblems =
      localStorage.getItem("dsaProblems");

    if (savedProblems) {
      const problems = JSON.parse(savedProblems);

      setDsaTotal(problems.length);

      const unsolved = problems.filter(
  (problem) => !problem.solved
);

setDsaSolved(
  problems.filter((problem) => problem.solved).length
);

setUnsolvedProblems(unsolved);
    } else {
      setDsaTotal(0);
      setDsaSolved(0);
      setUnsolvedProblems([]);
    }

    // Projects

    const savedProjects =
      localStorage.getItem("projects");

    if (savedProjects) {
      const projects = JSON.parse(savedProjects);

      setProjectCount(projects.length);
    } else {
      setProjectCount(0);
    }

    // Notes

    const savedNotes =
      localStorage.getItem("notes");

    if (savedNotes) {
      const notes = JSON.parse(savedNotes);

      setNoteCount(notes.length);
    } else {
      setNoteCount(0);
    }
  }

  useEffect(() => {
    loadDashboardData();

    window.addEventListener(
      "focus",
      loadDashboardData
    );

    return () => {
      window.removeEventListener(
        "focus",
        loadDashboardData
      );
    };
  }, []);

  const dsaProgress =
    dsaTotal === 0
      ? 0
      : Math.round(
          (dsaSolved / dsaTotal) * 100
        );

  return (
    <main className="dashboard">

      <h2>Today's Overview</h2>

      <p className="page-description">
        Your PersonalOS activity at a glance.
      </p>

      <div className="dashboard-grid">

        {/* Tasks */}

        <div className="dashboard-card">
          <h3>Tasks</h3>

          <div className="dashboard-number">
            {pendingTasks}
          </div>

          <p>
            pending out of {taskCount}
          </p>
        </div>

        {/* DSA */}

        <div className="dashboard-card">
          <h3>DSA</h3>

          <div className="dashboard-number">
            {dsaSolved}
          </div>

          <p>
            solved out of {dsaTotal}
          </p>
        </div>

        {/* DSA Progress */}

        <div className="dashboard-card">
          <h3>DSA Progress</h3>

          <div className="dashboard-number">
            {dsaProgress}%
          </div>

          <p>
            overall completion
          </p>
        </div>

        {/* Projects */}

        <div className="dashboard-card">
          <h3>Projects</h3>

          <div className="dashboard-number">
            {projectCount}
          </div>

          <p>
            total projects
          </p>
        </div>

        {/* Notes */}

        <div className="dashboard-card">
          <h3>Notes</h3>

          <div className="dashboard-number">
            {noteCount}
          </div>

          <p>
            total notes
          </p>
        </div>

      </div>
      <div className="focus-section">

  <h2>Today's Focus</h2>

  <div className="focus-grid">

    <div className="focus-card">

      <h3>Pending Tasks</h3>

      {pendingTaskList.length === 0 ? (
        <p className="focus-empty">
          No pending tasks.
        </p>
      ) : (
        <ul>
          {pendingTaskList
            .slice(0, 5)
            .map((task) => (
              <li key={task.id}>
                <strong>{task.text}</strong>

                <span>
                  {task.priority}
                </span>
              </li>
            ))}
        </ul>
      )}

    </div>


    <div className="focus-card">

      <h3>DSA Queue</h3>

      {unsolvedProblems.length === 0 ? (
        <p className="focus-empty">
          No unsolved problems.
        </p>
      ) : (
        <ul>
          {unsolvedProblems
            .slice(0, 5)
            .map((problem) => (
              <li key={problem.id}>
                <strong>
                  {problem.title}
                </strong>

                <span>
                  {problem.difficulty}
                </span>
              </li>
            ))}
        </ul>
      )}

    </div>

  </div>

</div>

    </main>
  );
}

export default Dashboard;