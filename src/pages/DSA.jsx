import { useEffect, useState } from "react";

function DSA() {
  const [filter, setFilter] = useState("All");
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
  },
  {
    id: 2,
    title: "Second Largest Element",
    topic: "Arrays",
    difficulty: "Easy",
    platform: "GFG",
    solved: true,
  },
  {
    id: 3,
    title: "Best Time to Buy and Sell Stock",
    topic: "Arrays",
    difficulty: "Easy",
    platform: "LeetCode",
    solved: false,
  },
  {
    id: 4,
    title: "Maximum Subarray",
    topic: "Arrays",
    difficulty: "Medium",
    platform: "LeetCode",
    solved: false,
  },
];

const [problems, setProblems] = useState(() => {
  const savedProblems = localStorage.getItem("dsaProblems");

  return savedProblems
    ? JSON.parse(savedProblems)
    : defaultProblems;
});
useEffect(() => {
  localStorage.setItem(
    "dsaProblems",
    JSON.stringify(problems)
  );
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

  const totalProblems = problems.length;

  const solvedProblems = problems.filter(
    (problem) => problem.solved
  ).length;

  const pendingProblems = totalProblems - solvedProblems;
  const todayProblems = problems.filter(
  (problem) => !problem.solved
);
 



  const filteredProblems = problems.filter((problem) => {

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

  function getTopicProgress(topic) {
    const topicProblems = problems.filter(
      (problem) => problem.topic === topic
    );

    const solved = topicProblems.filter(
      (problem) => problem.solved
    ).length;

    const percentage =
      topicProblems.length === 0
        ? 0
        : Math.round((solved / topicProblems.length) * 100);

    return {
      total: topicProblems.length,
      solved,
      percentage,
    };
  }

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
    <div className="topic-progress">

  <h3>Topic Progress</h3>

  {topics.map((topic) => {

    const progress = getTopicProgress(topic);

    return (
      <div className="topic-row" key={topic}>

        <div className="topic-info">

          <span>{topic}</span>

          <span>
            {progress.solved} / {progress.total}
          </span>

        </div>

        <div className="progress-bar">

          <div
            className="progress-fill"
            style={{
              width: `${progress.percentage}%`,
            }}
          ></div>

        </div>

      </div>
    );

  })}

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

              </div>

            </div>

          </div>

        ))}

      </div>

    </main>
  );
}
export default DSA;