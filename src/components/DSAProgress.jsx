import { motion } from "framer-motion";

function DSAProgress({ solved, total }) {
  const progress = total === 0 ? 0 : Math.round((solved / total) * 100);

  return (
    <section className="progress-card card">
      <div className="progress-header">
        <div>
          <h3>DSA Progress</h3>
          <p>Keep building your problem-solving skills.</p>
        </div>
        <strong>{progress}%</strong>
      </div>

      <div className="progress-bar">
        <motion.div
          className="progress-fill"
          initial={{ width: "0%" }}
          whileInView={{ width: `${progress}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>

      <div className="progress-footer">
        <span>{solved} solved</span>
        <span>{total - solved} remaining</span>
      </div>
    </section>
  );
}

export default DSAProgress;