import { useEffect, useState } from "react";
import { getStorage } from "../utils/storage";

function useDashboardData() {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [dsaProblems, setDsaProblems] = useState([]);
  const [notes, setNotes] = useState([]);

  function loadData() {
    setTasks(getStorage("tasks", []));
    setProjects(getStorage("projects", []));
    setDsaProblems(getStorage("dsaProblems", []));
    setNotes(getStorage("notes", []));
  }

  useEffect(() => {
    loadData();
    window.addEventListener("focus", loadData);
    return () => window.removeEventListener("focus", loadData);
  }, []);

  return { tasks, projects, dsaProblems, notes };
}

export default useDashboardData;