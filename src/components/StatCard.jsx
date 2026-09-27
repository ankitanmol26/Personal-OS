function StatCard({ title, value, description }) {
  return (
    <div className="dashboard-card">

      <h3>{title}</h3>

      <div className="dashboard-number">
        {value}
      </div>

      <p>
        {description}
      </p>

    </div>
  );
}

export default StatCard;