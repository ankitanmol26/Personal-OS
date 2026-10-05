import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

function DSAProgress({ solved, total }) {
  const progress = total === 0 ? 0 : Math.round((solved / total) * 100);

  return (
    <section className="hero-card">
      <div className="hero-header">
        <h3>DSA Progress</h3>
        <p>Keep building your problem-solving skills.</p>
      </div>

      <div className="plan-stats-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="plan-stat">
          <span className="plan-stat-value">{solved}</span>
          <span className="plan-stat-label">Solved</span>
        </div>
        <div className="plan-stat">
          <span className="plan-stat-value">{total - solved}</span>
          <span className="plan-stat-label">Remaining</span>
        </div>
      </div>

      <div className="plan-progress-container" style={{ marginTop: 'auto' }}>
        <div className="plan-progress-bar">
          <motion.div
            className="plan-progress-fill"
            initial={{ width: "0%" }}
            whileInView={{ width: `${progress}%` }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
      </div>
      
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <span style={{fontSize: '14px', fontWeight: 600, color: 'var(--accent-primary)'}}>{progress}% Completed</span>
        <Link to="/dsa" className="plan-action" style={{marginTop: 0}}>
          View All <ArrowRight size={14} />
        </Link>
      </div>
    </section>
  );
}

export default DSAProgress;