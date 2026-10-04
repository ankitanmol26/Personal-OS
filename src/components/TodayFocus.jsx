import { motion } from "framer-motion";

function getPriorityBadge(priority) {
  switch (priority) {
    case "High": return "badge badge-danger";
    case "Medium": return "badge badge-warning";
    case "Low": return "badge badge-info";
    default: return "badge";
  }
}

function getDifficultyBadge(difficulty) {
  switch (difficulty) {
    case "Hard": return "badge badge-danger";
    case "Medium": return "badge badge-warning";
    case "Easy": return "badge badge-success";
    default: return "badge";
  }
}

function TodayFocus({ pendingTaskList, unsolvedProblems }) {
  return (
    <section className="focus-section">
      <div className="section-heading">
        <h2>Today's Focus</h2>
        <p>The most important things waiting for you.</p>
      </div>

      <div className="focus-grid">
        <div className="card focus-card">
          <h3>Pending Tasks</h3>
          {pendingTaskList.length === 0 ? (
            <div className="empty-state">
              <p>No pending tasks. You're clear.</p>
            </div>
          ) : (
            <ul className="activity-list">
              {pendingTaskList.slice(0, 5).map((task, index) => (
                <motion.li 
                  key={task.id}
                  className="activity-item"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                >
                  <strong className="flex-1">{task.text}</strong>
                  <span className={getPriorityBadge(task.priority)}>
                    {task.priority}
                  </span>
                </motion.li>
              ))}
            </ul>
          )}
        </div>

        <div className="card focus-card">
          <h3>DSA Queue</h3>
          {unsolvedProblems.length === 0 ? (
            <div className="empty-state">
              <p>No unsolved problems.</p>
            </div>
          ) : (
            <ul className="activity-list">
              {unsolvedProblems.slice(0, 5).map((problem, index) => (
                <motion.li 
                  key={problem.id}
                  className="activity-item"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                >
                  <strong className="flex-1">{problem.title}</strong>
                  <span className={getDifficultyBadge(problem.difficulty)}>
                    {problem.difficulty}
                  </span>
                </motion.li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

export default TodayFocus;