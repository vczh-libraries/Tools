# `startTask` Internal Analysis

This document is a precise code-path analysis of `startTask` and the functions it calls.
It covers three topics the author asked about:

1. Do all possible crashes get reported via `taskDecision`?
2. Does error-to-string serialization work correctly?
3. Why does `onGeneratedUserPrompt` sometimes not appear during retries?

---

## 1. Crash Reporting via `taskDecision` — Completeness Audit

Every place that catches or throws an error inside the task execution
is listed below with its `taskDecision` call (or lack thereof).

### 1.1 `sendPromptWithCrashRetry` (lines 112-128)

```
catch (err) {
    drivingCallback.taskDecision(`Task execution crashed: ${String(err)}`);
    lastError = err;
}
```

- **Each failed attempt** inside the retry loop emits a `taskDecision`. ✅
- **When all retries are exhausted** (line 128 `throw lastError`), no additional
  `taskDecision` is emitted at this level — it relies on the caller to report.

### 1.2 `checkCriteria` (lines 219-228)

```
catch (err) {
    monitor.cleanup();
    callback.taskDecision(`Criteria condition check crashed: ${String(err)}`);
    throw err;
}
```

- Crash during criteria condition check is reported. ✅

### 1.3 `checkAvailability` (lines 253-258)

```
catch (err) {
    monitor.cleanup();
    callback.taskDecision(`Availability check crashed: ${String(err)}`);
    throw err;
}
```

- Crash during availability check is reported. ✅

### 1.4 `executePromptAndCheckCriteria` (lines 284-290)

```
catch (err) {
    monitor.cleanup();
    throw err;     // ⚠️ NO taskDecision here
}
```

- **BUG**: When `sendPromptWithCrashRetry` exhausts all retries and throws,
  `executePromptAndCheckCriteria` re-throws without emitting any `taskDecision`.
  However, `sendPromptWithCrashRetry` *did* emit one `taskDecision` per failed attempt,
  so the individual crashes are reported. The *aggregated* "all retries exhausted"
  fact is not reported at this level — it bubbles to the caller.
  This is acceptable because it is an intermediate function. ✅ (no info lost)

### 1.5 `startTask` execution body — initial task execution (lines 448-454)

```
catch (err) {
    callback.taskDecision(`Task execution crashed: ${String(err)}`);
    throw err;
}
```

- **ISSUE — Duplicate/misleading message**: `sendPromptWithCrashRetry` already emitted
  `"Task execution crashed: ..."` for each individual attempt. If it throws (all retries
  exhausted), the caller here emits yet another `taskDecision` with the exact same prefix
  `"Task execution crashed: ..."`. The user sees N+1 messages with the same prefix,
  making it unclear which one is the final one. Not a data-loss bug, but a clarity issue.

### 1.6 `startTask` execution body — RetryWithNewSession (lines 478-487)

```
catch (err) {
    callback.taskDecision(`Session crash during retry #${i + 1}: ${String(err)}`);
    continue;
}
```

- Reported. ✅
- Same note: `sendPromptWithCrashRetry` already emitted per-attempt decisions.

### 1.7 `startTask` execution body — RetryWithUserPrompt (lines 491-499)

```
catch (err) {
    callback.taskDecision(`Session crash during retry #${i + 1}: ${String(err)}`);
    continue;
}
```

- Reported. ✅

### 1.8 `startTask` outer catch (lines 522-536)

```
catch (err) {
    ...
    callback.taskDecision(`Task error: ${String(err)}`);
    ...
    callback.taskFailed();
    throw err;
}
```

- This is the final catch-all. Any error that propagates here is reported. ✅

### 1.9 `helperSessionStart` failure (lines 352-354)

```
const [session, sessionId] = await helperSessionStart(drivingModelId, workingDirectory);
```

- If `helperSessionStart` throws (e.g. network error, model not found),
  the error happens **before** the execution promise is created (lines 351-354 are
  in the synchronous setup of `startTask`).
  This means the error propagates as a rejected promise from `startTask()` itself.
  **No `taskDecision` is emitted** — the caller (`apiTaskStart`) catches it and
  returns `{ taskError: String(err) }` directly.
  But from the `taskDecision` perspective, there is a gap:
  **the website live-stream will never see a reason for why the task failed** when
  the driving session cannot be created. ⚠️

- Similarly, in double-session mode, if creating the *task* session fails
  (line 410 `helperSessionStart`), it throws inside the execution promise,
  caught by the outer catch (1.8). That **is** reported via `taskDecision`.

### 1.10 Crash inside `cleanupSessions`

```
await helperSessionStop(taskSession[0]).catch(() => {});
```

- Session stop errors are silently swallowed. This is intentional — cleanup
  should not cause secondary failures. ✅

### Summary: Crash reporting gaps

| Gap | Severity | Description |
|-----|----------|-------------|
| Driving session creation failure | Medium | If `helperSessionStart` fails during `startTask` setup (before execution promise), no `taskDecision` is emitted. The error only appears in the HTTP response. |
| Duplicate "Task execution crashed" messages | Low | `sendPromptWithCrashRetry` and its callers both emit messages with similar prefixes, making the live stream noisy and confusing. |

---

## 2. Error Serialization — `String(err)` Analysis

Every error serialization in the file uses `String(err)`.

### How `String(err)` behaves

- `String(new Error("msg"))` → `"Error: msg"` ✅ (includes class name + message)
- `String("a plain string")` → `"a plain string"` ✅
- `String(undefined)` → `"undefined"` ✅
- `String(null)` → `"null"` ✅
- `String(42)` → `"42"` ✅
- `String({ message: "x" })` → `"[object Object]"` ⚠️

### Potential problems

1. **`[object Object]` for non-Error objects**: If the Copilot SDK or any
   dependency throws a plain object (e.g. `{ message: "rate limited", code: 429 }`),
   `String(err)` yields `"[object Object]"`, losing all useful information.

   - **Affected locations**: Every `catch` block in the file (lines 122, 226, 257, 288, 452, 484, 497, 527).
   - **Recommendation**: Replace `String(err)` with a helper like:
     ```ts
     function errorToString(err: unknown): string {
         if (err instanceof Error) return err.message;  // or err.stack for full trace
         if (typeof err === "string") return err;
         try { return JSON.stringify(err); } catch { return String(err); }
     }
     ```

2. **Stack traces are lost**: `String(err)` on an `Error` gives `"Error: message"`
   but **not** the stack trace. For debugging purposes, `err.stack` would be far
   more useful.

   - **Recommendation**: For `taskDecision` messages meant for debugging, include
     `(err instanceof Error ? err.stack : String(err))`.

3. **AggregateError / cause chain**: Modern JS errors can have `.cause`.
   `String(err)` does not traverse the cause chain.

### Summary: Error serialization issues

| Issue | Severity | Description |
|-------|----------|-------------|
| Plain object errors | Medium | Non-Error thrown objects serialize to `"[object Object]"` |
| No stack traces | Medium | Stack is never included in `taskDecision`, making debugging harder |
| No cause chain | Low | Nested `.cause` is ignored |

---

## 3. Missing `onGeneratedUserPrompt` During Retries

### Design intent

`onGeneratedUserPrompt` is **by design** pushed to the session's live API
(`api/copilot/session/:id/live`) via `helperPushSessionResponse`. Its purpose is
to record generated (non-human-typed) prompts sent to an agent session. This is
correct — it belongs to session-level observability, not task-level.

### How the push works

`sendPromptWithCrashRetry` (line 119):

```ts
helperPushSessionResponse(session, { callback: "onGeneratedUserPrompt", prompt: actualPrompt });
await session.sendRequest(actualPrompt);
```

`helperPushSessionResponse` (copilotApi.ts line 140) iterates the global `sessions`
map, matches by object identity (`state.session === session`), and pushes to that
`SessionState.responseQueue`. The push succeeds as long as the session object is
still registered in the map.

### Root cause: session replacement and removal during retries

The `onGeneratedUserPrompt` push itself works correctly on the first attempt.
The problem manifests specifically during retries for the following reasons:

#### Cause A — `RetryWithNewSession` destroys the old session

1. `helperSessionStop(taskSession[0])` is called — this **removes** the old session
   from the `sessions` map.
2. A new session is created via `helperSessionStart` — added to the map with a
   **new** session ID.
3. `executePromptAndCheckCriteria` is called with the new `taskSessionObj`.
4. Inside, `sendPromptWithCrashRetry(newSession, ...)` pushes `onGeneratedUserPrompt`
   to the new session's `SessionState.responseQueue`.

The new session ID is reported via `taskSessionStarted(taskSession)` to the task
live stream. But the consumer (website) is already polling
`api/copilot/session/:oldId/live` for the original session. It receives a
`SessionNotFound` error when the old session is stopped. To see the new session's
`onGeneratedUserPrompt`, the consumer would need to notice the `taskSessionStarted`
callback and start polling `api/copilot/session/:newId/live`. If it doesn't, the
`onGeneratedUserPrompt` messages sit in the new session's queue unseen.

#### Cause B — Inner crash retry on a crashed session

Within `sendPromptWithCrashRetry`, when `session.sendRequest` throws (session
crash), the loop retries up to `MAX_CRASH_RETRIES` times on the **same** session
object:

```
Attempt 0: push onGeneratedUserPrompt → sendRequest() → throws
Attempt 1: push onGeneratedUserPrompt → sendRequest() → throws
Attempt 2: push onGeneratedUserPrompt → sendRequest() → throws → all retries exhausted
```

Each attempt **does** call `helperPushSessionResponse`, so the push to the queue
succeeds (the session is still in the `sessions` map — nobody called
`helperSessionStop`). However, the Copilot SDK session is in a crashed state.
The session's live poll consumer may have already received error/idle events from
the SDK that caused it to stop polling. The `onGeneratedUserPrompt` messages are
enqueued but the consumer is no longer reading from that queue.

#### Cause C — Criteria condition uses the driving session

When criteria has a `condition` prompt, `checkCriteria` calls
`sendPromptWithCrashRetry(drivingSession, ...)`. In double-session mode (jobs),
the driving session is a separate session created by `startTask`. Its session ID
is stored internally but the website may or may not be polling its live endpoint.
`onGeneratedUserPrompt` for criteria checks goes to the driving session's queue,
which may not be monitored.

### Summary: why retries show `taskDecision` but not `onGeneratedUserPrompt`

`taskDecision` messages (e.g. `"Starting retry #1"`, `"Session crash during retry #1"`)
are pushed to the `TaskState.responseQueue` via `callback.taskDecision`, which is polled
by `api/copilot/task/:id/live`.

`onGeneratedUserPrompt` is correctly pushed to `SessionState.responseQueue` via
`helperPushSessionResponse`, which is polled by `api/copilot/session/:id/live`.
But during retries, the session being pushed to is either:
- A **new** session whose live endpoint the consumer hasn't started polling yet
  (Cause A), or
- A **crashed** session whose live endpoint the consumer has stopped polling
  (Cause B), or
- The **driving** session in a double-session flow that nobody is polling (Cause C).

### Possible fixes (preserving the design that `onGeneratedUserPrompt` is session-level)

**Option A** — Ensure the consumer re-subscribes: When the website receives a
`taskSessionStarted` event with a new session ID, it should begin polling
`api/copilot/session/:newId/live` to pick up the new session's events including
`onGeneratedUserPrompt`. This is a website-side fix.

**Option B** — Mirror to task live stream: In addition to pushing to the session
queue (preserving session-level semantics), also push `onGeneratedUserPrompt` to
the task callback. This provides redundancy: the session live API remains the
canonical source, but the task live stream also receives the prompts for
observability when session polling is interrupted.

**Option C** — Defer the push until session health is confirmed: Instead of pushing
`onGeneratedUserPrompt` before `sendRequest`, push it after `sendRequest` succeeds.
This avoids enqueueing prompts for sessions that are about to crash. However, this
means a crashed attempt would have no `onGeneratedUserPrompt` record at all.

---

## 4. Additional Observability Gaps

### 4.1 No reporting when `stopped` short-circuits

There are three `if (stopped) return;` checks (lines 427, 433, 457).
When the task is stopped externally, the execution promise just returns
silently — no `taskDecision` explaining "task was stopped", no `taskFailed()`.

- The `stop()` method does set `status = "Failed"`, but `callback.taskFailed()`
  is never called. The live stream consumer might hang waiting for a final
  `taskSucceeded` or `taskFailed` message that never arrives.

### 4.2 `expandPrompt` can throw

`expandPrompt` (via `expandPromptDynamic`) could throw if template variables
are missing or malformed. This throw would be caught by the outer catch (1.8),
but the `taskDecision` would say `"Task error: ..."` which is generic.
A more specific message identifying which prompt expansion failed would help.

### 4.3 Session creation inside retry loop

In `RetryWithNewSession`, `helperSessionStart` can throw. This throw is
**not** caught by the inner try/catch (which only wraps
`executePromptAndCheckCriteria`). It propagates to the outer catch.
The user would see `"Task error: ..."` but not know it happened during
a retry's session creation, not during actual prompt execution.

### 4.4 `monitorSessionTools` cleanup

The `cleanup()` method only sets `active = false` but **never calls
`raw.off("tool.execution_start", onToolStart)`**. This means old listeners
accumulate on the session's event emitter across retries. It won't cause
crashes, but it means stale monitors may mutate `runtimeValues` unexpectedly
during retries.

---

## 5. Complete Call Graph

```
startTask()
├── helperSessionStart()                     // Can throw before execution promise
│
└── [execution promise]
    ├── helperSessionStart()                 // Double-session: can throw (caught by outer catch)
    ├── checkAvailability()
    │   └── sendPromptWithCrashRetry()       // onGeneratedUserPrompt → session queue
    │       └── helperPushSessionResponse()  // Pushes to session's queue, not task's
    │
    ├── executePromptAndCheckCriteria()      // Initial execution
    │   ├── sendPromptWithCrashRetry()       // onGeneratedUserPrompt → session queue
    │   └── checkCriteria()
    │       └── sendPromptWithCrashRetry()   // onGeneratedUserPrompt → session queue
    │
    ├── [Retry loop]
    │   ├── RetryWithNewSession:
    │   │   ├── helperSessionStop()
    │   │   ├── helperSessionStart()         // Can throw OUTSIDE inner try/catch ⚠️
    │   │   └── executePromptAndCheckCriteria()
    │   │       ├── sendPromptWithCrashRetry()
    │   │       └── checkCriteria()
    │   │           └── sendPromptWithCrashRetry()
    │   │
    │   └── RetryWithUserPrompt:
    │       └── executePromptAndCheckCriteria()
    │           ├── sendPromptWithCrashRetry()
    │           └── checkCriteria()
    │               └── sendPromptWithCrashRetry()
    │
    └── cleanupSessions()
```

---

## 6. Recommendations Summary

| # | Issue | Fix |
|---|-------|-----|
| 1 | `onGeneratedUserPrompt` lost during retries because consumer stops polling replaced/crashed sessions | Website should re-subscribe on `taskSessionStarted`, or mirror `onGeneratedUserPrompt` to task live stream as well |
| 2 | `String(err)` loses info for non-Error objects | Use a helper that tries `JSON.stringify` for objects |
| 3 | Stack traces not included | Include `err.stack` in `taskDecision` for debugging |
| 4 | `stopped` short-circuits silently | Emit `taskDecision("Task stopped by user")` + `taskFailed()` |
| 5 | Duplicate "Task execution crashed" messages | Differentiate per-attempt vs. final-failure messages |
| 6 | `helperSessionStart` in retry loop not inside try/catch | Wrap it or report properly |
| 7 | Monitor listeners accumulate | Call `raw.off()` in `cleanup()` |
| 8 | Driving session creation failure has no `taskDecision` | Wrap the pre-promise setup or emit before throwing |
