import { CheckCircle2, Code } from "lucide-react";
import { motion } from "framer-motion";

function RecentActivity({ tasks, dsaProblems }) {
  const activities = [];

  tasks
    .filter((task) => task.completed)
    .slice(-3)
    .forEach((task) => {
      activities.push({
        id: `task-${task.id}`,
        type: "Task",
        title: task.text,
        desc: "Completed task",
        date: task.completedAt || "Recent",
        icon: <CheckCircle2 size={16} />
      });
    });

  dsaProblems
    .filter((problem) => problem.solved)
    .slice(-3)
    .forEach((problem) => {
      activities.push({
        id: `dsa-${problem.id}`,
        type: "DSA",
        title: problem.title,
        desc: "Solved problem",
        date: "Recent",
        icon: <Code size={16} />
      });
    });

  const recentActivities = activities.slice(-4).reverse();

  return (
    <section className="hero-card">
      <div className="hero-header">
        <h3>Recent Activity</h3>
        <p>A quick look at your latest actions.</p>
      </div>

      {recentActivities.length === 0 ? (
        <div className="empty-state" style={{flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <p>No activity yet.</p>
        </div>
      ) : (
        <ul className="activity-feed">
          {recentActivities.map((activity, index) => (
            <motion.li 
              key={activity.id}
              className="activity-feed-item"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
            >
              <div className="activity-feed-icon">
                {activity.icon}
              </div>
              <div className="activity-feed-content">
                <strong className="activity-feed-desc">{activity.desc}: {activity.title}</strong>
                <span className="activity-feed-time">{activity.date}</span>
              </div>
            </motion.li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default RecentActivity;