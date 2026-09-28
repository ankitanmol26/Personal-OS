function TodayFocus({
  pendingTaskList,
  unsolvedProblems,
}) {
  return (
    <section className="focus-section">

      <div className="section-heading">
        <h2>Today's Focus</h2>
        <p>
          The most important things waiting for you.
        </p>
      </div>

      <div className="focus-grid">

        {/* Pending Tasks */}

        <div className="focus-card">

          <h3>Pending Tasks</h3>

          {pendingTaskList.length === 0 ? (
            <p className="focus-empty">
              No pending tasks. You're clear.
            </p>
          ) : (
            <ul>
              {pendingTaskList
                .slice(0, 5)
                .map((task) => (
                  <li key={task.id}>
                    <strong>
                      {task.text}
                    </strong>

                    <span>
                      {task.priority}
                    </span>
                  </li>
                ))}
            </ul>
          )}

        </div>


        {/* DSA Queue */}

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

    </section>
  );
}

export default TodayFocus;