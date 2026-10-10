import { openDB } from 'idb';
import { apiRequest } from './apiClient';
import { getStoredUser } from '../utils/authStorage';

const DB_NAME = 'personalos-offline-db';
const DB_VERSION = 2;
const STORE_NAME = 'expenses_queue';
const CACHE_STORE = 'trip_cache';

export async function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, newVersion, transaction) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'idempotencyKey' });
      }
      if (!db.objectStoreNames.contains(CACHE_STORE)) {
        db.createObjectStore(CACHE_STORE, { keyPath: 'tripId' });
      }
    },
  });
}

export async function cacheTripData(tripId, data) {
  const user = getStoredUser();
  if (!user) return;
  const db = await getDB();
  await db.put(CACHE_STORE, { tripId: `${user.id}_${tripId}`, ...data });
}

export async function getCachedTripData(tripId) {
  const user = getStoredUser();
  if (!user) return null;
  const db = await getDB();
  return await db.get(CACHE_STORE, `${user.id}_${tripId}`);
}

export async function queueExpenseCreation(tripId, payload) {
  const user = getStoredUser();
  if (!user) throw new Error("Must be logged in to queue expense");
  const accountId = user.id;
  
  const db = await getDB();
  const idempotencyKey = crypto.randomUUID();
  const operation = {
    idempotencyKey,
    operationType: 'CREATE_SHARED_EXPENSE',
    accountId,
    tripId,
    clientCreatedAt: new Date().toISOString(),
    payload,
    status: 'pending',
    attemptCount: 0,
    lastErrorCode: null,
    lastErrorMessage: null
  };
  
  await db.put(STORE_NAME, operation);
  
  // Trigger sync asynchronously
  triggerSync().catch(console.error);
  
  return operation;
}

export async function getPendingExpenses(tripId) {
  const user = getStoredUser();
  if (!user) return [];
  const db = await getDB();
  const allOps = await db.getAll(STORE_NAME);
  return allOps.filter(op => op.accountId === user.id && op.tripId === tripId && op.operationType === 'CREATE_SHARED_EXPENSE');
}

export async function cancelPendingExpense(idempotencyKey) {
  const db = await getDB();
  await db.delete(STORE_NAME, idempotencyKey);
  window.dispatchEvent(new Event('sync:completed'));
}

export async function retryPendingExpense(idempotencyKey) {
  const db = await getDB();
  const op = await db.get(STORE_NAME, idempotencyKey);
  if (op) {
    op.status = 'pending';
    op.attemptCount = 0;
    await db.put(STORE_NAME, op);
    triggerSync().catch(console.error);
  }
}

let isSyncing = false;

export async function triggerSync() {
  if (isSyncing) return;
  if (!navigator.onLine) return;
  
  if (navigator.locks) {
      return navigator.locks.request('sync_queue', { ifAvailable: true }, async (lock) => {
          if (!lock) return;
          await doSync();
      });
  } else {
      await doSync();
  }
}

async function doSync() {
  const user = getStoredUser();
  if (!user) return;
  
  isSyncing = true;
  let didWork = false;
  try {
    const db = await getDB();
    const allOps = await db.getAll(STORE_NAME);
    const myOps = allOps.filter(op => op.accountId === user.id && op.status !== 'synced' && op.status !== 'conflict');

    for (const op of myOps) {
      if (!navigator.onLine) break;
      
      // Exponential backoff
      if (op.attemptCount > 0) {
        const delay = Math.min(1000 * Math.pow(2, op.attemptCount - 1), 60000);
        const timeSinceLastAttempt = Date.now() - new Date(op.lastAttemptAt || 0).getTime();
        if (timeSinceLastAttempt < delay) {
            setTimeout(() => triggerSync().catch(console.error), delay - timeSinceLastAttempt + 100);
            continue;
        }
      }

      try {
        op.status = 'syncing';
        op.lastAttemptAt = new Date().toISOString();
        await db.put(STORE_NAME, op);
        window.dispatchEvent(new Event('sync:progress'));

        await apiRequest(`/api/trips/${op.tripId}/shared-expenses`, {
          method: "POST",
          headers: {
            "Idempotency-Key": op.idempotencyKey
          },
          body: JSON.stringify(op.payload)
        });

        // successful
        await db.delete(STORE_NAME, op.idempotencyKey);
        didWork = true;
      } catch (err) {
        if (err.status === 401) {
            // Unauth, stop syncing
            op.status = 'pending';
            await db.put(STORE_NAME, op);
            break;
        }
        if (err.status >= 400 && err.status < 500 && err.status !== 408 && err.status !== 429 && err.status !== 409) {
            // Permanent failure (400, 403, 404)
            op.status = 'conflict';
            op.lastErrorCode = err.status;
            op.lastErrorMessage = err.message || "Validation or permission error";
            await db.put(STORE_NAME, op);
            didWork = true;
        } else if (err.status === 409) {
            // Conflict idempotency
            op.status = 'conflict';
            op.lastErrorCode = err.status;
            op.lastErrorMessage = err.message || "Conflict: idempotency key reused with different payload";
            await db.put(STORE_NAME, op);
            didWork = true;
        } else {
            // Transient error (network or 5xx)
            op.status = 'failed';
            op.attemptCount = (op.attemptCount || 0) + 1;
            op.lastErrorMessage = err.message || "Network error";
            await db.put(STORE_NAME, op);
            didWork = true;
            
            const nextDelay = Math.min(1000 * Math.pow(2, op.attemptCount - 1), 60000);
            setTimeout(() => triggerSync().catch(console.error), nextDelay + 100);
        }
      }
    }
  } finally {
    isSyncing = false;
    if (didWork) {
        window.dispatchEvent(new Event('sync:completed'));
    }
  }
}

window.addEventListener('online', () => triggerSync().catch(console.error));
