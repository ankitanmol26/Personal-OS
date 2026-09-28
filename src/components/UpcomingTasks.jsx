function UpcomingTasks({ tasks }) {
  const today = new Date()
    .toISOString()
    .split("T")[0];

  const upcomingTasks = tasks
    .filter((task) => {
      return (
        !task.completed &&
        task.dueDate &&
        task.dueDate >= today
      );
    })
    .sort((a, b) =>
      a.dueDate.localeCompare(b.dueDate)
    )
    .slice(0, 5);

  return (
    <section className="upcoming-card">

      <div className="section-heading">
        <h3>Upcoming Tasks</h3>

        <p>
          Your next deadlines.
        </p>
      </div>

      {upcomingTasks.length === 0 ? (
        <p className="focus-empty">
          No upcoming tasks.
        </p>
      ) : (
        <ul className="upcoming-list">

          {upcomingTasks.map((task) => (
            <li key={task.id}>

              <div>
                <strong>
                  {task.text}
                </strong>

                <small>
                  Due {task.dueDate}
                </small>
              </div>

              <span>
                {task.priority}
              </span>

            </li>
          ))}

        </ul>
      )}

    </section>
  );
}

export default UpcomingTasks;