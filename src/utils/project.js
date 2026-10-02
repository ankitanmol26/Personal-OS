import { getTodayDate } from "./date";

export function isProjectOverdue(project) {
  if (
    !project.deadline ||
    project.status === "Completed"
  ) {
    return false;
  }

  return project.deadline < getTodayDate();
}
