import { useEffect, useState } from "react";
import { getStorage } from "../utils/storage";
import { isOverdue, isRevisionDue } from "../utils/date";

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
  const overdueTasks = tasks.filter(
  (task) => isOverdue(task)
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

  const dsaDueToday = dsaProblems.filter(
    (problem) => isRevisionDue(problem)
  );

  const dsaMastered = dsaProblems.filter(
    (problem) =>
      problem.revisionStatus === "Mastered"
  );

  const plannerTasks = getStorage("plannerTasks");

  const today = new Date()
    .toISOString()
    .split("T")[0];

  const plannerTodayTasks = plannerTasks.filter(
    (task) => task.date === today
  );

  const plannerCompletedToday =
    plannerTodayTasks.filter(
      (task) => task.completed
    );

  const plannerOverdueTasks =
    plannerTasks.filter(
      (task) =>
        task.date < today &&
        !task.completed
    );

  return {
    plannerTodayTasks,
    plannerTodayCount: plannerTodayTasks.length,
    plannerCompletedTodayCount:
      plannerCompletedToday.length,
    plannerRemainingTodayCount:
      plannerTodayTasks.length -
      plannerCompletedToday.length,
    plannerOverdueCount:
      plannerOverdueTasks.length,
    tasks,
    dsaProblems,

    taskCount: tasks.length,
    pendingTasks,
    pendingTaskCount: pendingTasks.length,

    overdueTasks,
    overdueTaskCount: overdueTasks.length,

    dsaTotal: dsaProblems.length,
    dsaSolved: solvedProblems.length,
    unsolvedProblems,
    dsaProgress,

    dsaDueToday,
    dsaDueTodayCount: dsaDueToday.length,
    dsaMasteredCount: dsaMastered.length,

    projectCount,
    noteCount,
  };
}

export default useDashboardData;