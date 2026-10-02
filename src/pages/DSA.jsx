import { useEffect, useState } from "react";
import {
  getStorage,
  setStorage,
} from "../utils/storage";

import {
  getTodayDate,
  addDays,
   isRevisionDue,
} from "../utils/date";

function DSA() {
  const [filter, setFilter] = useState("All");
  const [revisionFilter, setRevisionFilter] = useState("All");
  const [title, setTitle] = useState("");
const [topic, setTopic] = useState("Arrays");
const [difficulty, setDifficulty] = useState("Easy");
const [platform, setPlatform] = useState("LeetCode");
const [problemNumber, setProblemNumber] = useState("");
const [problemLink, setProblemLink] = useState("");
const [notes, setNotes] = useState("");
 const defaultProblems = [
  {
    id: 1,
    title: "Two Sum",
    topic: "Arrays",
    difficulty: "Easy",
    platform: "LeetCode",
    solved: true,
    revisionStatus: "Needs Revision",
  },
  {
    id: 2,
    title: "Second Largest Element",
    topic: "Arrays",
    difficulty: "Easy",
    platform: "GFG",
    solved: true,
revisionStatus: "Not Started",
  },
  {
    id: 3,
    title: "Best Time to Buy and Sell Stock",
    topic: "Arrays",
    difficulty: "Easy",
    platform: "LeetCode",
    solved: false,
revisionStatus: "Not Started",
  },
  {
    id: 4,
    title: "Maximum Subarray",
    topic: "Arrays",
    difficulty: "Medium",
    platform: "LeetCode",
    solved: false,
    revisionStatus: "Not Started",
  },
];

const [problems, setProblems] = useState(() => {
  const savedProblems = getStorage(
    "dsaProblems",
    null
  );

  return savedProblems ?? defaultProblems;
});
useEffect(() => {
  setStorage("dsaProblems", problems);
}, [problems]);
function addProblem(event) {
  event.preventDefault();

  if (title.trim() === "") {
    return;
  }

  const newProblem = {
  id: Date.now(),
  title: title,
  topic: topic,
  difficulty: difficulty,
  platform: platform,
  problemNumber: problemNumber,
  problemLink: problemLink,
  notes: notes,
  solved: false,
  revisionStatus: "Not Started",
   revisionCount: 0,
  nextRevisionDate: null,
};

  setProblems([...problems, newProblem]);

  setTitle("");
  setTopic("Arrays");
  setDifficulty("Easy");
  setPlatform("LeetCode");
  setProblemNumber("");
  setProblemLink("");
setNotes("");
}

  function toggleSolved(id) {
    setProblems(
      problems.map((problem) =>
        problem.id === id
          ? {
              ...problem,
              solved: !problem.solved,
            }
          : problem
      )
    );
  }

  function updateRevisionStatus(id, status) {
    setProblems(
      problems.map((problem) =>
        problem.id === id
          ? {
              ...problem,
              revisionStatus: status,
            }
          : problem
      )
    );
  }
  function reviseProblem(id) {
  const today = getTodayDate();

  setProblems(
    problems.map((problem) => {
      if (problem.id !== id) {
        return problem;
      }

      const revisionCount =
        (problem.revisionCount || 0) + 1;

      const intervals = [1, 3, 7, 14, 30];

      const interval =
        intervals[
          Math.min(
            revisionCount - 1,
            intervals.length - 1
          )
        ];

      return {
        ...problem,
        revisionCount,
        revisionStatus: "Needs Revision",
        nextRevisionDate: addDays(
          today,
          interval
        ),
      };
    })
  );
}
  const totalProblems = problems.length;

  const solvedProblems = problems.filter(
    (problem) => problem.solved
  ).length;

  const pendingProblems = totalProblems - solvedProblems;
  const todayProblems = problems.filter(
  (problem) => !problem.solved
);
const revisionProblems = problems.filter(
  (problem) => isRevisionDue(problem)
);

const masteredProblems = problems.filter(
  (problem) => problem.revisionStatus === "Mastered"
).length;

const dueRevisionCount = revisionProblems.length;

const easyProblems = problems.filter(
  (problem) => problem.difficulty === "Easy"
).length;

const mediumProblems = problems.filter(
  (problem) => problem.difficulty === "Medium"
).length;

const hardProblems = problems.filter(
  (problem) => problem.difficulty === "Hard"
).length;

  const filteredProblems = problems.filter((problem) => {

  if (
    revisionFilter !== "All" &&
    (problem.revisionStatus || "Not Started") !== revisionFilter
  ) {
    return false;
  }

  if (filter === "Solved") {
    return problem.solved;
  }

  if (filter === "Unsolved") {
    return !problem.solved;
  }

  if (
    filter === "Easy" ||
    filter === "Medium" ||
    filter === "Hard"
  ) {
    return problem.difficulty === filter;
  }

  return true;
});

  const topics = [...new Set(problems.map((problem) => problem.topic))];

  const topicProgress = topics.map((topic) => {
    const topicProblems = problems.filter(
      (problem) => problem.topic === topic
    );

    const solved = topicProblems.filter(
      (problem) => problem.solved
    ).length;

    const total = topicProblems.length;

    const percentage =
      total === 0
        ? 0
        : Math.round((solved / total) * 100);

    return {
      topic,
      total,
      solved,
      percentage,
    };
  });

  return (
    <main className="dashboard">

      <h2>DSA Tracker</h2>

      <p className="page-description">
        Track your DSA practice and problem-solving progress.
      </p>
      <form className="dsa-form" onSubmit={addProblem}>

  <input
    type="text"
    placeholder="Problem title"
    value={title}
    onChange={(event) => setTitle(event.target.value)}
  />

  <input
    type="number"
    placeholder="Problem number"
    value={problemNumber}
    onChange={(event) =>
      setProblemNumber(event.target.value)
    }
  />
  <input
  type="url"
  placeholder="Problem URL"
  value={problemLink}
  onChange={(event) =>
    setProblemLink(event.target.value)
  }
/>

<input
  type="text"
  placeholder="Quick note"
  value={notes}
  onChange={(event) =>
    setNotes(event.target.value)
  }
/>

  <select
    value={topic}
    onChange={(event) => setTopic(event.target.value)}
  >
    <option value="Arrays">Arrays</option>
    <option value="Strings">Strings</option>
    <option value="Hashing">Hashing</option>
    <option value="Recursion">Recursion</option>
    <option value="Linked List">Linked List</option>
    <option value="Stack">Stack</option>
    <option value="Queue">Queue</option>
    <option value="Binary Search">Binary Search</option>
    <option value="Trees">Trees</option>
    <option value="Graphs">Graphs</option>
    <option value="Dynamic Programming">
      Dynamic Programming
    </option>
  </select>

  <select
    value={difficulty}
    onChange={(event) =>
      setDifficulty(event.target.value)
    }
  >
    <option value="Easy">Easy</option>
    <option value="Medium">Medium</option>
    <option value="Hard">Hard</option>
  </select>

  <select
    value={platform}
    onChange={(event) =>
      setPlatform(event.target.value)
    }
  >
    <option value="LeetCode">LeetCode</option>
    <option value="GFG">GFG</option>
    <option value="CodeChef">CodeChef</option>
    <option value="HackerRank">HackerRank</option>
  </select>

  <button type="submit">
    Add Problem
  </button>

</form>

      <div className="task-stats">

        <div className="stat-card">
          <h3>{totalProblems}</h3>
          <p>Total Problems</p>
        </div>

        <div className="stat-card">
          <h3>{solvedProblems}</h3>
          <p>Solved</p>
        </div>

        <div className="stat-card">
          <h3>{pendingProblems}</h3>
          <p>Pending</p>
        </div>

      </div>

      <div className="dsa-summary">

        <div className="dsa-summary-card">
          <span>Total Problems</span>
          <strong>{totalProblems}</strong>
        </div>

        <div className="dsa-summary-card">
          <span>Solved</span>
          <strong>{solvedProblems}</strong>
        </div>

        <div className="dsa-summary-card">
          <span>Due Today</span>
          <strong>{dueRevisionCount}</strong>
        </div>

        <div className="dsa-summary-card">
          <span>Mastered</span>
          <strong>{masteredProblems}</strong>
        </div>

      </div>

      <div className="difficulty-section">

        <div className="section-heading">
          <h3>Difficulty Breakdown</h3>

          <p>
            See how your problem set is distributed.
          </p>
        </div>

        <div className="difficulty-grid">

          <div className="difficulty-card">
            <span>Easy</span>
            <strong>{easyProblems}</strong>
          </div>

          <div className="difficulty-card">
            <span>Medium</span>
            <strong>{mediumProblems}</strong>
          </div>

          <div className="difficulty-card">
            <span>Hard</span>
            <strong>{hardProblems}</strong>
          </div>

        </div>

      </div>

    <div className="topic-progress">
      <h3>Topic Progress</h3>

      <div className="topic-progress-list">
        {topicProgress.map((item) => (
          <div
            className="topic-progress-item"
            key={item.topic}
          >
            <div className="topic-progress-header">
              <span>
                {item.topic}
              </span>
              <span>
                {item.solved}/{item.total}
              </span>
            </div>

            <div className="progress-bar">
              <div
                className="progress-bar-fill"
                style={{
                  width: `${item.percentage}%`,
                }}
              />
            </div>

            <small>
              {item.percentage}% complete
            </small>
          </div>
        ))}
      </div>
    </div>

      <section className="revision-today">

        <div className="section-heading">
          <h3>Revision Due Today</h3>
          <p>
            Problems that are ready for revision now.
          </p>
        </div>

        {revisionProblems.length === 0 ? (
          <p className="empty-message">
            No revisions due today. Good.
          </p>
        ) : (
          <div className="revision-today-list">

            {revisionProblems.slice(0, 5).map((problem) => (
              <div
                className="revision-today-item"
                key={problem.id}
              >
                <div>
                  <h4>{problem.title}</h4>

                  <div className="task-details">
                    <span>{problem.topic}</span>
                    <span>{problem.difficulty}</span>
                    <span>
                      Revisions: {problem.revisionCount || 0}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => reviseProblem(problem.id)}
                >
                  Revise
                </button>
              </div>
            ))}

          </div>
        )}

      </section>

      <div className="revision-queue">

        <div className="revision-queue-header">

          <div>
            <h3>Revision Queue</h3>

            <p>
              Problems you should revise again.
            </p>
          </div>

          <span className="today-count">
            {revisionProblems.length} pending
          </span>

        </div>

        {revisionProblems.length === 0 ? (

          <p className="empty-message">
            No problems need revision.
          </p>

        ) : (

          <div className="revision-list">

            {revisionProblems
              .slice(0, 5)
              .map((problem) => (

                <div
                  className="revision-item"
                  key={problem.id}
                >

                  <div>

                    <h4>
                      {problem.title}
                    </h4>

                    <div className="task-details">
                      <span>{problem.topic}</span>
                      <span>{problem.difficulty}</span>
                      <span>{problem.platform}</span>
                    </div>

                    <div className="revision-info">

                      <p className="revision-count">
                        Revisions: {problem.revisionCount || 0}
                      </p>

                      {problem.nextRevisionDate && (
                        <p className="revision-date">
                          Next revision: {problem.nextRevisionDate}
                        </p>
                      )}

                    </div>

                  </div>

                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      type="button"
                      onClick={() => reviseProblem(problem.id)}
                    >
                      Revise
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        updateRevisionStatus(
                          problem.id,
                          "Mastered"
                        )
                      }
                    >
                      Mastered
                    </button>
                  </div>

                </div>

              ))}

          </div>

        )}

      </div>

      <div className="today-dsa">

  <div className="today-dsa-header">

    <div>
      <h3>Today's DSA</h3>
      <p>Problems waiting to be solved.</p>
    </div>

    <span className="today-count">
      {todayProblems.length} pending
    </span>

  </div>

  {todayProblems.length === 0 ? (

    <p className="empty-message">
      All problems are solved. Nice work!
    </p>

  ) : (

    <div className="today-problem-list">

      {todayProblems.slice(0, 3).map((problem) => (

        <div
          className="today-problem"
          key={problem.id}
        >

          <div>

            <h4>{problem.title}</h4>

            <div className="task-details">

              <span>{problem.topic}</span>
              <span>{problem.difficulty}</span>
              <span>{problem.platform}</span>

            </div>

          </div>

          <button
            onClick={() => toggleSolved(problem.id)}
          >
            Mark Solved
          </button>

        </div>

      ))}

    </div>

  )}

</div>

      <div className="task-filters">

  <button
    onClick={() => setFilter("All")}
    className={filter === "All" ? "active-filter" : ""}
  >
    All
  </button>

  <button
    onClick={() => setFilter("Unsolved")}
    className={filter === "Unsolved" ? "active-filter" : ""}
  >
    Unsolved
  </button>

  <button
    onClick={() => setFilter("Solved")}
    className={filter === "Solved" ? "active-filter" : ""}
  >
    Solved
  </button>

  <button
    onClick={() => setFilter("Easy")}
    className={filter === "Easy" ? "active-filter" : ""}
  >
    Easy
  </button>

  <button
    onClick={() => setFilter("Medium")}
    className={filter === "Medium" ? "active-filter" : ""}
  >
    Medium
  </button>

  <button
    onClick={() => setFilter("Hard")}
    className={filter === "Hard" ? "active-filter" : ""}
  >
    Hard
  </button>

  <button
    onClick={() => setRevisionFilter("All")}
    className={
      revisionFilter === "All"
        ? "active-filter"
        : ""
    }
  >
    All Revision
  </button>

  <button
    onClick={() => setRevisionFilter("Needs Revision")}
    className={
      revisionFilter === "Needs Revision"
        ? "active-filter"
        : ""
    }
  >
    Needs Revision
  </button>

  <button
    onClick={() => setRevisionFilter("Mastered")}
    className={
      revisionFilter === "Mastered"
        ? "active-filter"
        : ""
    }
  >
    Mastered
  </button>

</div>
      <div className="dsa-list">

        {filteredProblems.map((problem) => (

          <div className="dsa-item" key={problem.id}>

            <div className="dsa-left">

              <input
                type="checkbox"
                checked={problem.solved}
                onChange={() => toggleSolved(problem.id)}
              />

              <div>

                <h3
                  className={
                    problem.solved
                      ? "completed-task"
                      : ""
                  }
                >
                  {problem.title}
                </h3>

                <div className="task-details">
                  {problem.problemNumber && (
  <span>#{problem.problemNumber}</span>
)}
                  <span>{problem.topic}</span>

                  <span>{problem.difficulty}</span>

                  <span>{problem.platform}</span>

                </div>

                {problem.notes && (
                  <p className="problem-notes">
                    {problem.notes}
                  </p>
                )}

                {problem.problemLink && (
                  <a
                    href={problem.problemLink}
                    target="_blank"
                    rel="noreferrer"
                    className="problem-link"
                  >
                    Open Problem →
                  </a>
                )}

                <div className="revision-control">
                  <label>
                    Revision
                  </label>
                  <select
                    value={
                      problem.revisionStatus ||
                      "Not Started"
                    }
                    onChange={(event) =>
                      updateRevisionStatus(
                        problem.id,
                        event.target.value
                      )
                    }
                  >
                    <option value="Not Started">
                      Not Started
                    </option>
                    <option value="Needs Revision">
                      Needs Revision
                    </option>
                    <option value="Mastered">
                      Mastered
                    </option>
                  </select>
                </div>

              </div>

            </div>

          </div>

        ))}

      </div>

    </main>
  );
}
export default DSA;