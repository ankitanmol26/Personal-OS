import { useEffect, useState } from "react";

function Dashboard() {
  const [taskCount, setTaskCount] = useState(0);
  const [pendingTasks, setPendingTasks] = useState(0);

  const [dsaTotal, setDsaTotal] = useState(0);
  const [dsaSolved, setDsaSolved] = useState(0);

  useEffect(() => {
    const savedTasks = localStorage.getItem("tasks");

    if (savedTasks) {
      const tasks = JSON.parse(savedTasks);

      setTaskCount(tasks.length);

      setPendingTasks(
        tasks.filter((task) => !task.completed).length
      );
    }

    const savedProblems =
      localStorage.getItem("dsaProblems");

    if (savedProblems) {
      const problems = JSON.parse(savedProblems);

      setDsaTotal(problems.length);

      setDsaSolved(
        problems.filter((problem) => problem.solved).length
      );
    }
  }, []);

  return (
    <main className="dashboard">

      <h2>Today's Overview</h2>

      <p className="page-description">
        Your PersonalOS activity at a glance.
      </p>

      <div className="dashboard-grid">

        <div className="dashboard-card">

          <h3>Tasks</h3>

          <div className="dashboard-number">
            {pendingTasks}
          </div>

          <p>
            pending out of {taskCount}
          </p>

        </div>

        <div className="dashboard-card">

          <h3>DSA</h3>

          <div className="dashboard-number">
            {dsaSolved}
          </div>

          <p>
            solved out of {dsaTotal}
          </p>

        </div>

        <div className="dashboard-card">

          <h3>DSA Progress</h3>

          <div className="dashboard-number">

            {dsaTotal === 0
              ? 0
              : Math.round(
                  (dsaSolved / dsaTotal) * 100
                )}

            %

          </div>

          <p>
            overall completion
          </p>

        </div>

      </div>

    </main>
  );
}

export default Dashboard;