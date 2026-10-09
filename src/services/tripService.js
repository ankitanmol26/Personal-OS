import { apiGet, apiPost, apiPut, apiDelete } from './apiClient';

export async function getTrips() {
  return await apiGet('/api/trips');
}

export async function createTrip(data) {
  return await apiPost('/api/trips', data);
}

export async function updateTrip(id, data) {
  return await apiPut(`/api/trips/${id}`, data);
}

export async function deleteTrip(id) {
  return await apiDelete(`/api/trips/${id}`);
}

export async function getTripMembers(tripId) {
  return await apiGet(`/api/trips/${tripId}/members`);
}

export async function addTripMember(tripId, email) {
  return await apiPost(`/api/trips/${tripId}/members`, { email });
}

export async function removeTripMember(tripId, userId) {
  return await apiDelete(`/api/trips/${tripId}/members/${userId}`);
}

export async function getSharedExpenses(tripId) {
  return await apiGet(`/api/trips/${tripId}/shared-expenses`);
}

export async function createSharedExpense(tripId, data) {
  return await apiPost(`/api/trips/${tripId}/shared-expenses`, data);
}

export async function deleteSharedExpense(tripId, expenseId) {
  return await apiDelete(`/api/trips/${tripId}/shared-expenses/${expenseId}`);
}

export async function getMemberBalances(tripId) {
  return await apiGet(`/api/trips/${tripId}/shared-expenses/balances`);
}
