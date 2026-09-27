import { useEffect, useState } from "react";
import StatCard from "../components/StatCard";
import { getStorage } from "../utils/storage";

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

  const tasks = getStorage("tasks");

  setTaskCount(tasks.length);

  const pending = tasks.filter(
    (task) => !task.completed
  );

  setPendingTasks(pending.length);
  setPendingTaskList(pending);


  // DSA

  const problems = getStorage(
    "dsaProblems",
    []
  );

  setDsaTotal(problems.length);

  const solved = problems.filter(
    (problem) => problem.solved
  );

  const unsolved = problems.filter(
    (problem) => !problem.solved
  );

  setDsaSolved(solved.length);
  setUnsolvedProblems(unsolved);


  // Projects

  const projects = getStorage(
    "projects"
  );

  setProjectCount(projects.length);


  // Notes

  const notes = getStorage(
    "notes"
  );

  setNoteCount(notes.length);
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

        <StatCard
          title="Tasks"
          value={pendingTasks}
          description={`pending out of ${taskCount}`}
        />

        <StatCard
          title="DSA"
          value={dsaSolved}
          description={`solved out of ${dsaTotal}`}
        />

        <StatCard
          title="DSA Progress"
          value={`${dsaProgress}%`}
          description="overall completion"
        />

        <StatCard
          title="Projects"
          value={projectCount}
          description="total projects"
        />

        <StatCard
          title="Notes"
          value={noteCount}
          description="total notes"
        />

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