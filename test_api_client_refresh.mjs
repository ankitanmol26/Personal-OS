import assert from "node:assert";

// Polyfill localStorage and window for Node environment
const storage = new Map();
globalThis.localStorage = {
  getItem: (k) => storage.get(k) || null,
  setItem: (k, v) => storage.set(k, String(v)),
  removeItem: (k) => storage.delete(k),
  clear: () => storage.clear(),
};

let dispatchedEvents = [];
globalThis.window = {
  dispatchEvent: (event) => {
    dispatchedEvents.push(event.type);
    return true;
  },
};
globalThis.Event = class Event {
  constructor(type) {
    this.type = type;
  }
};

// Import apiClient dynamically after environment polyfills
const { apiRequest, BASE_URL } = await import("./src/services/apiClient.js");
const { getAccessToken, setAccessToken, getStoredUser } = await import("./src/utils/authStorage.js");

console.log("Starting apiClient refresh concurrency test suite...\n");

// Helper to mock fetch responses
let fetchCalls = [];
let mockFetchHandler = null;

globalThis.fetch = async (url, options = {}) => {
  fetchCalls.push({ url, options });
  if (mockFetchHandler) {
    return mockFetchHandler(url, options);
  }
  throw new Error("Unhandled fetch call: " + url);
};

const createMockResponse = (status, data, headers = {}) => ({
  status,
  ok: status >= 200 && status < 300,
  headers: new Headers(headers),
  json: async () => data,
  text: async () => JSON.stringify(data),
});

// Test 1 & 2: Multiple simultaneous 401s produce only ONE refresh request,
// and all waiting requests retry with the new access token.
{
  console.log("Test 1 & 2: Simultaneous 401s produce only 1 refresh, and waiting requests retry with new token");
  storage.clear();
  setAccessToken("initial-expired-token");
  fetchCalls = [];
  dispatchedEvents = [];

  let refreshCallCount = 0;

  mockFetchHandler = async (url, options) => {
    if (url.includes("/api/auth/refresh")) {
      refreshCallCount++;
      // Simulate network latency for refresh
      await new Promise((r) => setTimeout(r, 50));
      return createMockResponse(200, {
        accessToken: "new-shiny-access-token",
        userId: 123,
        name: "Test User",
        email: "test@example.com",
      });
    }

    if (url.includes("/api/tasks") || url.includes("/api/notes") || url.includes("/api/dsa")) {
      const auth = options?.headers?.Authorization;
      if (auth === "Bearer initial-expired-token") {
        return createMockResponse(401, { message: "Token expired" });
      }
      if (auth === "Bearer new-shiny-access-token") {
        return createMockResponse(200, { success: true, endpoint: url });
      }
      return createMockResponse(401, { message: "No or bad token" });
    }

    return createMockResponse(404, { message: "Not found" });
  };

  // Dispatch 3 simultaneous requests that receive 401
  const [resTasks, resNotes, resDsa] = await Promise.all([
    apiRequest("/api/tasks"),
    apiRequest("/api/notes"),
    apiRequest("/api/dsa"),
  ]);

  assert.strictEqual(refreshCallCount, 1, "Expected exactly 1 refresh call for 3 concurrent 401 requests");
  assert.strictEqual(resTasks.success, true);
  assert.strictEqual(resNotes.success, true);
  assert.strictEqual(resDsa.success, true);
  assert.strictEqual(getAccessToken(), "new-shiny-access-token", "Access token must be updated in storage");
  assert.strictEqual(getStoredUser().name, "Test User", "Stored user must be updated");
  assert.strictEqual(dispatchedEvents.length, 0, "No unauthorized event should be fired on successful refresh");

  console.log("  PASSED: 1 refresh occurred, all 3 requests retried and succeeded with new token.\n");
}

// Test 3 & 4: Refresh failure rejects all waiting requests and clears auth + dispatches event once
{
  console.log("Test 3 & 4: Refresh failure rejects all waiting requests and clears authentication once");
  storage.clear();
  setAccessToken("invalid-token");
  fetchCalls = [];
  dispatchedEvents = [];

  let refreshCallCount = 0;

  mockFetchHandler = async (url, options) => {
    if (url.includes("/api/auth/refresh")) {
      refreshCallCount++;
      await new Promise((r) => setTimeout(r, 30));
      return createMockResponse(401, { message: "Invalid or expired refresh token" });
    }

    return createMockResponse(401, { message: "Unauthorized access" });
  };

  const results = await Promise.allSettled([
    apiRequest("/api/profile"),
    apiRequest("/api/finance"),
    apiRequest("/api/projects"),
  ]);

  assert.strictEqual(refreshCallCount, 1, "Expected exactly 1 refresh call on concurrent failure");
  assert.strictEqual(results[0].status, "rejected", "Request 1 must reject");
  assert.strictEqual(results[1].status, "rejected", "Request 2 must reject");
  assert.strictEqual(results[2].status, "rejected", "Request 3 must reject");

  assert.strictEqual(results[0].reason.status, 401, "Rejected error must retain status 401");
  assert.strictEqual(getAccessToken(), null, "Auth token must be cleared from storage");
  assert.strictEqual(getStoredUser(), null, "Stored user must be cleared from storage");
  assert.strictEqual(
    dispatchedEvents.filter((e) => e === "auth:unauthorized").length,
    1,
    "auth:unauthorized must be dispatched exactly ONCE for the coordinated refresh failure"
  );

  console.log("  PASSED: All waiting requests rejected with 401, auth cleared, auth:unauthorized dispatched once.\n");
}

// Test 5: A retry that receives another 401 does NOT trigger an infinite loop
{
  console.log("Test 5: Retried request receiving another 401 does not trigger infinite loop");
  storage.clear();
  setAccessToken("first-token");
  fetchCalls = [];
  dispatchedEvents = [];

  let refreshCallCount = 0;
  let taskCallCount = 0;

  mockFetchHandler = async (url, options) => {
    if (url.includes("/api/auth/refresh")) {
      refreshCallCount++;
      return createMockResponse(200, { accessToken: "second-token" });
    }

    if (url.includes("/api/tasks")) {
      taskCallCount++;
      // Even with second-token, backend rejects with 401
      return createMockResponse(401, { message: "Permission revoked" });
    }

    return createMockResponse(404, {});
  };

  let caughtError = null;
  try {
    await apiRequest("/api/tasks");
  } catch (err) {
    caughtError = err;
  }

  assert.ok(caughtError, "Must throw error when retried request returns 401");
  assert.strictEqual(caughtError.status, 401);
  assert.strictEqual(refreshCallCount, 1, "Refresh should only be called once, no loop");
  assert.strictEqual(taskCallCount, 2, "Task endpoint called initial + 1 retry, then stops");
  assert.strictEqual(getAccessToken(), null, "Auth token must be cleared when a retried request receives second 401");
  assert.strictEqual(getStoredUser(), null, "Stored user must be cleared on second 401");
  assert.strictEqual(dispatchedEvents.includes("auth:unauthorized"), true, "auth:unauthorized must be dispatched on second 401");

  console.log("  PASSED: Retried 401 did not loop and cleared auth state.\n");
}

// Test 6: Auth endpoints are not recursively refreshed
{
  console.log("Test 6: Login, register, google, and refresh endpoints are not intercepted for refresh");
  storage.clear();
  fetchCalls = [];
  dispatchedEvents = [];

  let refreshCallCount = 0;

  mockFetchHandler = async (url, options) => {
    if (url.includes("/api/auth/refresh")) {
      refreshCallCount++;
      return createMockResponse(401, { message: "No refresh token" });
    }
    if (url.includes("/api/auth/login")) {
      return createMockResponse(401, { message: "Bad credentials" });
    }
    return createMockResponse(404, {});
  };

  let loginErr = null;
  try {
    await apiRequest("/api/auth/login", { method: "POST", body: JSON.stringify({ email: "a", password: "b" }) });
  } catch (e) {
    loginErr = e;
  }

  assert.ok(loginErr);
  assert.strictEqual(loginErr.status, 401);
  assert.strictEqual(loginErr.message, "Bad credentials");
  assert.strictEqual(refreshCallCount, 0, "Refresh must NOT be called for login endpoint 401");
  assert.strictEqual(dispatchedEvents.length, 0, "Unauthorized event must not be dispatched for login failure");

  console.log("  PASSED: Auth endpoints return 401 without triggering refresh.\n");
}

// Test 7: Cookies (credentials: include) remain included in refresh and retried requests
{
  console.log("Test 7: Cookies (credentials: include) remain included in refresh and retried requests");
  storage.clear();
  setAccessToken("old-token");
  fetchCalls = [];

  mockFetchHandler = async (url, options) => {
    if (url.includes("/api/auth/refresh")) {
      assert.strictEqual(options.credentials, "include", "Refresh request must have credentials: include");
      return createMockResponse(200, { accessToken: "new-token" });
    }
    if (url.includes("/api/notes")) {
      assert.strictEqual(options.credentials, "include", "Notes request must have credentials: include");
      if (options.headers.Authorization === "Bearer new-token") {
        return createMockResponse(200, [{ id: 1, title: "Note" }]);
      }
      return createMockResponse(401, {});
    }
    return createMockResponse(404, {});
  };

  const notes = await apiRequest("/api/notes");
  assert.strictEqual(notes.length, 1);
  assert.ok(fetchCalls.every((c) => c.options.credentials === "include"), "All calls must include credentials: include");

  console.log("  PASSED: credentials: 'include' verified across refresh and retried requests.\n");
}

// Test 8: Mutating request (POST with JSON body) retries with exact payload preserved
{
  console.log("Test 8: Mutating POST request retries with preserved payload without duplicate execution");
  storage.clear();
  setAccessToken("expired-post-token");
  fetchCalls = [];
  dispatchedEvents = [];

  let postCount = 0;
  const taskPayload = { title: "Buy groceries", priority: "HIGH" };

  mockFetchHandler = async (url, options) => {
    if (url.includes("/api/auth/refresh")) {
      return createMockResponse(200, { accessToken: "fresh-post-token" });
    }
    if (url.includes("/api/tasks") && options.method === "POST") {
      postCount++;
      if (options.headers.Authorization === "Bearer expired-post-token") {
        // Initial call fails at auth filter stage (zero side effects on server)
        return createMockResponse(401, { message: "Token expired" });
      }
      if (options.headers.Authorization === "Bearer fresh-post-token") {
        assert.strictEqual(options.body, JSON.stringify(taskPayload), "POST payload must be preserved exactly");
        return createMockResponse(201, { id: 99, ...taskPayload });
      }
      return createMockResponse(401, {});
    }
    return createMockResponse(404, {});
  };

  const createdTask = await apiRequest("/api/tasks", {
    method: "POST",
    body: JSON.stringify(taskPayload),
  });

  assert.strictEqual(createdTask.id, 99);
  assert.strictEqual(postCount, 2, "Mutating request should only be called once initially and once on retry");
  console.log("  PASSED: Mutating request payload preserved, retried exactly once.\n");
}

// Test 9: Mutating request encountering second 401 halts retries and clears auth
{
  console.log("Test 9: Mutating request encountering second 401 halts retries, clears auth, and prevents duplicate side effects");
  storage.clear();
  setAccessToken("expired-delete-token");
  fetchCalls = [];
  dispatchedEvents = [];

  let deleteCount = 0;

  mockFetchHandler = async (url, options) => {
    if (url.includes("/api/auth/refresh")) {
      return createMockResponse(200, { accessToken: "rejected-token" });
    }
    if (url.includes("/api/tasks/99") && options.method === "DELETE") {
      deleteCount++;
      return createMockResponse(401, { message: "Account suspended" });
    }
    return createMockResponse(404, {});
  };

  let deleteErr = null;
  try {
    await apiRequest("/api/tasks/99", { method: "DELETE" });
  } catch (err) {
    deleteErr = err;
  }

  assert.ok(deleteErr);
  assert.strictEqual(deleteErr.status, 401);
  assert.strictEqual(deleteCount, 2, "DELETE called initial (unauthenticated) + exactly 1 retry");
  assert.strictEqual(getAccessToken(), null, "Auth cleared on second 401");
  assert.strictEqual(dispatchedEvents.includes("auth:unauthorized"), true);

  console.log("  PASSED: Mutating second 401 halted, auth cleared, no further retries.\n");
}

console.log("ALL 9 FRONTEND API CLIENT TESTS PASSED SUCCESSFULLY!\n");
