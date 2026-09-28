function RecentActivity({ tasks, dsaProblems }) {
  const activities = [];

  // Completed tasks
  tasks
    .filter((task) => task.completed)
    .slice(-3)
    .forEach((task) => {
      activities.push({
        id: `task-${task.id}`,
        type: "Task",
        title: `Completed: ${task.text}`,
      });
    });

  // Solved DSA problems
  dsaProblems
    .filter((problem) => problem.solved)
    .slice(-3)
    .forEach((problem) => {
      activities.push({
        id: `dsa-${problem.id}`,
        type: "DSA",
        title: `Solved: ${problem.title}`,
      });
    });

  const recentActivities = activities.slice(-6).reverse();

  return (
    <section className="recent-activity">

      <div className="section-heading">
        <h3>Recent Activity</h3>

        <p>
          A quick look at your recent progress.
        </p>
      </div>

      {recentActivities.length === 0 ? (
        <p className="focus-empty">
          No activity yet. Start working and your
          progress will appear here.
        </p>
      ) : (
        <ul className="activity-list">

          {recentActivities.map((activity) => (
            <li key={activity.id}>

              <div className="activity-icon">
                {activity.type === "DSA"
                  ? "D"
                  : "T"}
              </div>

              <div className="activity-content">

                <strong>
                  {activity.title}
                </strong>

                <span>
                  {activity.type}
                </span>

              </div>

            </li>
          ))}

        </ul>
      )}

    </section>
  );
}

export default RecentActivity;