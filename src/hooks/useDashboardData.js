import { useEffect, useState, useCallback } from "react";
import { getTasks } from "../services/taskService";
import { getProjects } from "../services/projectService";
import { getProblems as getDsaProblems } from "../services/dsaService";
import { getNotes } from "../services/noteService";
import { useApi } from "./useApi";

function useDashboardData() {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [dsaProblems, setDsaProblems] = useState([]);
  const [notes, setNotes] = useState([]);
  
  const { loading, error, withApiLoading, setError } = useApi(true);

  const loadData = useCallback(async () => {
    try {
      const [fetchedTasks, fetchedProjects, fetchedDsa, fetchedNotes] = await withApiLoading(
        () => Promise.all([getTasks(), getProjects(), getDsaProblems(), getNotes()]),
        "Failed to load dashboard data."
      );
      setTasks(fetchedTasks || []);
      setProjects(fetchedProjects || []);
      setDsaProblems(fetchedDsa || []);
      setNotes(fetchedNotes || []);
    } catch (e) {
      // error handled by withApiLoading hook
    }
  }, [withApiLoading]);

  useEffect(() => {
    loadData();
    window.addEventListener("focus", loadData);
    return () => window.removeEventListener("focus", loadData);
  }, [loadData]);

  return { tasks, projects, dsaProblems, notes, loading, error, loadData };
}

export default useDashboardData;