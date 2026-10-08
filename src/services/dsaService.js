const API_URL = 'http://localhost:8080/api/dsa';

export async function getProblems() {
  const response = await fetch(API_URL);
  if (!response.ok) {
    throw new Error('Failed to fetch DSA problems');
  }
  return response.json();
}

export async function createProblem(problem) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(problem),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("Create problem failed:", response.status, errorBody);
    throw new Error(`Failed to create problem: ${response.status} ${errorBody}`);
  }

  return response.json();
}

export async function updateProblem(id, problem) {
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(problem),
  });
  if (!response.ok) {
    throw new Error('Failed to update problem');
  }
  return response.json();
}

export async function deleteProblem(id) {
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete problem');
  }
}
