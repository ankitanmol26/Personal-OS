function Dashboard() {
  return (
    <main className="dashboard">
      <h2>Today's Overview</h2>

      <div className="cards">

        <div className="card">
          <h3>Tasks</h3>
          <p>3 remaining</p>
        </div>

        <div className="card">
          <h3>DSA</h3>
          <p>2 problems today</p>
        </div>

        <div className="card">
          <h3>Projects</h3>
          <p>1 active project</p>
        </div>

      </div>
    </main>
  );
}

export default Dashboard;