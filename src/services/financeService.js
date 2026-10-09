import { apiGet, apiPost, apiPut, apiDelete } from './apiClient';

export async function getTransactions() {
  return await apiGet('/api/transactions');
}

export async function createTransaction(data) {
  return await apiPost('/api/transactions', data);
}

export async function updateTransaction(id, data) {
  return await apiPut(`/api/transactions/${id}`, data);
}

export async function deleteTransaction(id) {
  return await apiDelete(`/api/transactions/${id}`);
}
