const API_URL = 'http://localhost:8080/api/planner-tasks';

export async function getPlannerTasks() {
  const response = await fetch(API_URL);
  if (!response.ok) {
    throw new Error('Failed to fetch planner tasks');
  }
  return response.json();
}

export async function createPlannerTask(task) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(task),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("Create planner task failed:", response.status, errorBody);
    throw new Error(`Failed to create planner task: ${response.status} ${errorBody}`);
  }

  return response.json();
}

export async function updatePlannerTask(id, task) {
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(task),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("Update planner task failed:", response.status, errorBody);
    throw new Error(`Failed to update planner task: ${response.status} ${errorBody}`);
  }

  return response.json();
}

export async function deletePlannerTask(id) {
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete planner task');
  }
}
