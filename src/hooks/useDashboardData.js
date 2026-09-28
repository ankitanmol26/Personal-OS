import { useEffect, useState } from "react";
import { getStorage } from "../utils/storage";

function useDashboardData() {
  const [tasks, setTasks] = useState([]);
  const [dsaProblems, setDsaProblems] = useState([]);
  const [projectCount, setProjectCount] = useState(0);
  const [noteCount, setNoteCount] = useState(0);

  function loadData() {
    const storedTasks = getStorage("tasks");

    const storedDsaProblems = getStorage(
      "dsaProblems"
    );

    const storedProjects = getStorage(
      "projects"
    );

    const storedNotes = getStorage(
      "notes"
    );

    setTasks(storedTasks);
    setDsaProblems(storedDsaProblems);
    setProjectCount(storedProjects.length);
    setNoteCount(storedNotes.length);
  }

  useEffect(() => {
    loadData();

    window.addEventListener(
      "focus",
      loadData
    );

    return () => {
      window.removeEventListener(
        "focus",
        loadData
      );
    };
  }, []);

  const pendingTasks = tasks.filter(
    (task) => !task.completed
  );

  const solvedProblems = dsaProblems.filter(
    (problem) => problem.solved
  );

  const unsolvedProblems = dsaProblems.filter(
    (problem) => !problem.solved
  );

  const dsaProgress =
    dsaProblems.length === 0
      ? 0
      : Math.round(
          (solvedProblems.length /
            dsaProblems.length) *
            100
        );

  return {
    tasks,
    dsaProblems,

    taskCount: tasks.length,
    pendingTasks,
    pendingTaskCount: pendingTasks.length,

    dsaTotal: dsaProblems.length,
    dsaSolved: solvedProblems.length,
    unsolvedProblems,
    dsaProgress,

    projectCount,
    noteCount,
  };
}

export default useDashboardData;