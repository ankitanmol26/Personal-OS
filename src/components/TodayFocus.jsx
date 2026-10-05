import { motion } from "framer-motion";
import { CheckSquare, Code2 } from "lucide-react";

function TodayFocus({ pendingTaskList, unsolvedProblems }) {
  const items = [];
  
  if (pendingTaskList.length > 0) {
    items.push({
      id: `task-${pendingTaskList[0].id}`,
      type: "task",
      title: pendingTaskList[0].text,
      subtitle: pendingTaskList[0].project || "Task",
      badge: pendingTaskList[0].priority
    });
  }

  if (unsolvedProblems.length > 0) {
    items.push({
      id: `dsa-${unsolvedProblems[0].id}`,
      type: "dsa",
      title: unsolvedProblems[0].title,
      subtitle: "DSA Problem",
      badge: unsolvedProblems[0].difficulty
    });
  }

  if (pendingTaskList.length > 1) {
    items.push({
      id: `task-${pendingTaskList[1].id}`,
      type: "task",
      title: pendingTaskList[1].text,
      subtitle: pendingTaskList[1].project || "Task",
      badge: pendingTaskList[1].priority
    });
  }

  const displayItems = items.slice(0, 3);

  return (
    <section className="hero-card" style={{gridColumn: 'span 1'}}>
      <div className="hero-header">
        <h3>Today's Focus</h3>
        <p>What you should work on right now.</p>
      </div>

      {displayItems.length === 0 ? (
        <div className="empty-state" style={{flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <p>You're all clear today.</p>
        </div>
      ) : (
        <div className="focus-layout">
          {displayItems.map((item, index) => (
            <motion.div 
              key={item.id}
              className={`focus-item ${item.type}`}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <div className="focus-item-icon">
                {item.type === "task" ? <CheckSquare size={16} /> : <Code2 size={16} />}
              </div>
              <div className="focus-item-details">
                <span className="focus-item-title">{item.title}</span>
                <span className="focus-item-subtitle">{item.subtitle}</span>
              </div>
              <span className="focus-item-badge">{item.badge}</span>
            </motion.div>
          ))}
        </div>
      )}
    </section>
  );
}

export default TodayFocus;