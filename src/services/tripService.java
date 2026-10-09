const API_URL = "http://localhost:8080/api/trips";

export async function getTrips() {
  const response = await fetch(API_URL);
  if (!response.ok) {
    throw new Error("Failed to fetch trips");
  }
  return await response.json();
}

export async function createTrip(trip) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(trip),
  });
  if (!response.ok) {
    throw new Error("Failed to create trip");
  }
  return await response.json();
}

export async function updateTrip(id, trip) {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(trip),
  });
  if (!response.ok) {
    throw new Error("Failed to update trip");
  }
  return await response.json();
}

export async function deleteTrip(id) {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error("Failed to delete trip");
  }
}
