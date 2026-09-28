function DSAProgress({
  solved,
  total,
}) {
  const progress =
    total === 0
      ? 0
      : Math.round((solved / total) * 100);

  return (
    <section className="progress-card">

      <div className="progress-header">

        <div>
          <h3>DSA Progress</h3>

          <p>
            Keep building your problem-solving skills.
          </p>
        </div>

        <strong>
          {progress}%
        </strong>

      </div>

      <div className="progress-bar">

        <div
          className="progress-fill"
          style={{
            width: `${progress}%`,
          }}
        />

      </div>

      <div className="progress-footer">

        <span>
          {solved} solved
        </span>

        <span>
          {total - solved} remaining
        </span>

      </div>

    </section>
  );
}

export default DSAProgress;