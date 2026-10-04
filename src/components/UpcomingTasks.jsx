import { motion } from "framer-motion";

function getPriorityBadge(priority) {
  switch (priority) {
    case "High": return "badge badge-danger";
    case "Medium": return "badge badge-warning";
    case "Low": return "badge badge-info";
    default: return "badge";
  }
}

function UpcomingTasks({ tasks }) {
  const today = new Date().toISOString().split("T")[0];

  const upcomingTasks = tasks
    .filter((task) => !task.completed && task.dueDate && task.dueDate >= today)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 5);

  return (
    <section className="upcoming-card card">
      <div className="section-heading">
        <h3>Upcoming Tasks</h3>
        <p>Your next deadlines.</p>
      </div>

      {upcomingTasks.length === 0 ? (
        <div className="empty-state">
          <p>No upcoming tasks.</p>
        </div>
      ) : (
        <ul className="activity-list">
          {upcomingTasks.map((task, index) => (
            <motion.li 
              key={task.id}
              className="activity-item"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
            >
              <div className="activity-content flex-1">
                <strong>{task.text}</strong>
                <span>Due {task.dueDate}</span>
              </div>
              <span className={getPriorityBadge(task.priority)}>
                {task.priority}
              </span>
            </motion.li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default UpcomingTasks;