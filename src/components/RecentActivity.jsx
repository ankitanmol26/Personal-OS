import { CheckCircle2, Code } from "lucide-react";
import { motion } from "framer-motion";

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
    <section className="recent-activity card">
      <div className="section-heading">
        <h3>Recent Activity</h3>
        <p>A quick look at your recent progress.</p>
      </div>

      {recentActivities.length === 0 ? (
        <div className="empty-state">
          <p>No activity yet. Start working and your progress will appear here.</p>
        </div>
      ) : (
        <ul className="activity-list">
          {recentActivities.map((activity, index) => (
            <motion.li 
              key={activity.id}
              className="activity-item"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
            >
              <div className="activity-icon">
                {activity.type === "DSA" ? (
                  <Code size={16} className="text-info" />
                ) : (
                  <CheckCircle2 size={16} className="text-success" />
                )}
              </div>
              <div className="activity-content">
                <strong>{activity.title}</strong>
                <span>{activity.type}</span>
              </div>
            </motion.li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default RecentActivity;