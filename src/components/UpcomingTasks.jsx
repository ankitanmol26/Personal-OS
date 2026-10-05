import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

function UpcomingTasks({ tasks }) {
  const today = new Date().toISOString().split("T")[0];

  const upcomingTasks = tasks
    .filter((task) => !task.completed && task.dueDate && task.dueDate >= today)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 4);

  return (
    <section className="hero-card">
      <div className="hero-header">
        <h3>Upcoming Tasks</h3>
        <p>Your next deadlines.</p>
      </div>

      {upcomingTasks.length === 0 ? (
        <div className="empty-state" style={{flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <p>No upcoming tasks.</p>
        </div>
      ) : (
        <ul className="timeline-list">
          {upcomingTasks.map((task, index) => {
            const priorityClass = task.priority ? task.priority.toLowerCase() : 'low';
            return (
              <motion.li 
                key={task.id}
                className="timeline-item"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
              >
                <div className={`timeline-indicator ${priorityClass}`} />
                <div className="timeline-content flex-1">
                  <strong className="timeline-title">{task.text}</strong>
                  <span className="timeline-date">Due {task.dueDate}</span>
                </div>
              </motion.li>
            );
          })}
        </ul>
      )}
      <Link to="/planner" className="plan-action" style={{ marginTop: 'auto', paddingTop: '16px' }}>
        View Calendar <ArrowRight size={14} />
      </Link>
    </section>
  );
}

export default UpcomingTasks;