const API_URL = 'http://localhost:8080/api/notes';

export async function getNotes() {
  const response = await fetch(API_URL);
  if (!response.ok) {
    throw new Error('Failed to fetch notes');
  }
  return response.json();
}

export async function getNoteById(id) {
  const response = await fetch(`${API_URL}/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch note');
  }
  return response.json();
}

export async function createNote(note) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(note),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("Create note failed:", response.status, errorBody);
    throw new Error(`Failed to create note: ${response.status} ${errorBody}`);
  }

  return response.json();
}

export async function updateNote(id, note) {
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(note),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("Update note failed:", response.status, errorBody);
    throw new Error(`Failed to update note: ${response.status} ${errorBody}`);
  }

  return response.json();
}

export async function deleteNote(id) {
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete note');
  }
}
