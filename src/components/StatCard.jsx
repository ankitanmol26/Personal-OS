import { motion } from "framer-motion";

function StatCard({ title, value, description }) {
  return (
    <motion.div 
      className="card stat-card"
      whileHover={{ y: -2, boxShadow: "var(--shadow-md)" }}
      transition={{ duration: 0.2 }}
    >
      <h3 className="stat-card-title">{title}</h3>
      <div className="stat-card-value">{value}</div>
      <p className="stat-card-description">{description}</p>
    </motion.div>
  );
}

export default StatCard;