export function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

export function isOverdue(task) {
  if (!task.dueDate || task.completed) {
    return false;
  }

  return task.dueDate < getTodayDate();
}

export function addDays(dateString, days) {
  const date = new Date(`${dateString}T00:00:00`);

  date.setDate(date.getDate() + days);

  return date.toISOString().split("T")[0];
}

export function isRevisionDue(problem) {
  if (
    problem.revisionStatus !== "Needs Revision"
  ) {
    return false;
  }

  if (!problem.nextRevisionDate) {
    return true;
  }

  return problem.nextRevisionDate <= getTodayDate();
}