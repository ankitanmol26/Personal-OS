import { motion } from "framer-motion";

function StatCard({ title, value, description, type, delay = 0 }) {
  // Define indicators based on type
  const indicatorColor = {
    accent: "var(--accent-primary)",
    info: "var(--status-info)",
    success: "var(--status-success)",
    danger: "var(--status-danger)",
    warning: "var(--status-warning)",
  }[type] || "var(--text-muted)";

  return (
    <motion.div 
      className="stat-card"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: delay * 0.04, ease: "easeOut" }}
    >
      <h3 className="stat-card-title">
        {title}
        <span className="stat-card-indicator" style={{ backgroundColor: indicatorColor }} />
      </h3>
      <div className="stat-card-value">{value}</div>
      <p className="stat-card-description">{description}</p>
    </motion.div>
  );
}

export default StatCard;