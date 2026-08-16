# TaskForge API — Test Plan, Demo Script & Viva Prep

All commands below assume the server is running with `npm start` on the
default port 3000, and are written for **PowerShell**. Replace
`<TASK_ID>` with a real id from a `GET /tasks` response (ids are UUIDs
generated at creation time, so yours will differ from any shown here).

---

## 1. TaskForge API Test Plan

| # | Test | Method & URL | Body | Expected Status | Expected Response (shape) | What it proves |
|---|------|---------------|------|------------------|-----------------------------|------------------|
| 1 | Get all tasks | GET `/tasks` | — | 200 | JSON array of tasks | Basic read route works |
| 2 | Get existing task | GET `/tasks/<TASK_ID>` | — | 200 | Single task object | `:id` param lookup works |
| 3 | Get nonexistent task | GET `/tasks/does-not-exist` | — | 404 | `{ "error": "Task not found" }` | 404 handling for missing resource |
| 4 | Create valid task | POST `/tasks` | `{"title":"Buy milk"}` | 201 | New task with generated `id`, `complete:false`, `createdAt` | Creation + validation pass |
| 5 | Create with missing title | POST `/tasks` | `{}` | 400 | `{ "error": "Title is required..." }` | Required-field validation |
| 6 | Create with empty title | POST `/tasks` | `{"title":""}` | 400 | Same as above | Empty-string rejected |
| 7 | Create with non-string title | POST `/tasks` | `{"title":123}` | 400 | Same as above | Type validation |
| 8 | Update existing task | PUT `/tasks/<TASK_ID>` | `{"complete":true}` | 200 | Updated task object | Update logic + persistence |
| 9 | Update nonexistent task | PUT `/tasks/does-not-exist` | `{"title":"x"}` | 404 | `{ "error": "Task not found" }` | 404 on update |
| 10 | Delete existing task | DELETE `/tasks/<TASK_ID>` | — | 204 | *(empty body)* | Deletion + persistence |
| 11 | Delete nonexistent task | DELETE `/tasks/does-not-exist` | — | 404 | `{ "error": "Task not found" }` | 404 on delete |
| 12 | Verify a valid task | GET `/tasks/<TASK_ID>/verify` | — | 200 (after 1-2s) | `{ "verified": true, ... }` | Async delay + success path |
| 13 | Verify the broken seed task | GET `/tasks/<TASK_ID_BROKEN>/verify` | — | 422 | `{ "error": "Task failed verification..." }` | Handles invalid data without crashing |
| 14 | Verify nonexistent task | GET `/tasks/does-not-exist/verify` | — | 404 | `{ "error": "Task not found" }` | 404 before the delay even starts |
| 15 | Malformed JSON body | POST `/tasks` | `{"title":"Broken"` *(no closing brace)* | 400 | `{ "error": "Malformed JSON in request body" }` | `express.json()` errors reach the centralized handler |
| 16 | Unknown route | GET `/something-that-does-not-exist` | — | 404 | `{ "error": "Route not found" }` | Clean JSON 404, not an HTML page |
| 17 | Restart persistence | *(see steps below)* | — | 200 | Previously created/updated/deleted tasks match `data/tasks.json` | `fs/promises` persistence is real |
| 18 | Static frontend | GET `/` in a browser | — | 200 | Task list renders, Refresh button works | `express.static` + Fetch API |
| 19 | Logging middleware | *(any request)* | — | — | Console prints `[timestamp] METHOD /path` | Global middleware runs for every request |
| 20 | Server survives after errors | Run tests 3, 5, 9, 15, 16 back-to-back, then GET `/tasks` | — | 200 | Normal task list | Errors never crash the process |

---

## 2. Curl / PowerShell Commands

```powershell
# 1. GET /tasks
curl.exe -s http://localhost:3000/tasks

# 2. GET /tasks/:id  (replace TASK_ID)
curl.exe -s http://localhost:3000/tasks/TASK_ID

# 3. POST /tasks
curl.exe -s -X POST http://localhost:3000/tasks `
  -H "Content-Type: application/json" `
  -d '{\"title\":\"Buy milk\"}'

# 4. PUT /tasks/:id
curl.exe -s -X PUT http://localhost:3000/tasks/TASK_ID `
  -H "Content-Type: application/json" `
  -d '{\"complete\":true}'

# 5. DELETE /tasks/:id
curl.exe -s -X DELETE http://localhost:3000/tasks/TASK_ID

# 6. GET /tasks/:id/verify
curl.exe -s http://localhost:3000/tasks/TASK_ID/verify

# 7. Malformed JSON
curl.exe -s -X POST http://localhost:3000/tasks `
  -H "Content-Type: application/json" `
  -d '{\"title\":\"Broken\"'

# 8. Unknown route
curl.exe -s http://localhost:3000/no-such-route
```

> **PowerShell quoting note:** PowerShell treats `"` specially inside
> single-quoted strings passed to external programs like `curl.exe`, so the
> examples above escape inner quotes as `\"`. If that gives you trouble,
> the simplest fix is to use Postman or Thunder Client instead of raw curl
> on Windows.

### Postman / Thunder Client instructions

For each request:
1. Set the method (GET/POST/PUT/DELETE) and URL (e.g. `http://localhost:3000/tasks`).
2. For POST/PUT, go to the **Body** tab, choose **raw** → **JSON**, and paste the JSON body.
3. Send, and check the status code and JSON response against the table above.

---

## 3. Restart Persistence Test (manual steps)

1. `npm start`
2. `POST /tasks` with `{"title":"Persistence check"}` — note the returned `id`.
3. Press `Ctrl+C` to stop the server.
4. `npm start` again.
5. `GET /tasks` — confirm the "Persistence check" task is still present.
6. Open `data/tasks.json` directly in your editor — confirm it's there too.

---

## 4. Automated vs. Manual Testing — Design Choice

This project intentionally uses a **manual test plan** (this document) plus
one small helper script (`test_persistence.js`, used only during
development to verify restart persistence, not part of the submitted app)
rather than a full automated test suite with a framework like Jest or
Mocha.

**Why:** the brief explicitly restricts dependencies to `express` and
`uuid` and asks for a beginner-level, easy-to-explain project. Adding a
test runner and assertion library would introduce new concepts (test
runners, mocking, `describe`/`it` blocks) that aren't part of the assigned
learning objectives, and would risk overshadowing the core material
(Express, middleware, async/await, fs.promises, error handling). A
thorough manual test plan, run through Postman/Thunder Client/curl,
exercises every route and every error path just as rigorously and is
easier to explain line-by-line in a viva.

---

## 5. Demonstration Plan (3-5 minutes)

| Step | Action | What to say |
|------|--------|-------------|
| 1 | `npm start` | "This starts the Express server on port 3000." |
| 2 | Point at the console | "The startup message confirms the server is listening, and the logger middleware will print every request below it." |
| 3 | `GET /tasks` | "This returns all tasks from `data/tasks.json`, read with `fs/promises`." |
| 4 | `POST /tasks` with a new title | "This validates the title, generates a UUID, and writes the new task to disk — status 201." |
| 5 | `GET /tasks/:id` for the new task | "Confirms the task was created and is retrievable by id." |
| 6 | `PUT /tasks/:id` marking it complete | "Updates the task in memory and re-writes tasks.json — status 200." |
| 7 | `DELETE /tasks/:id` | "Removes the task and returns 204 with no body." |
| 8 | `GET /tasks/:id/verify` on a valid task | "This simulates calling a slow external service — notice the 1-2 second delay before the 200 response." |
| 9 | `GET /tasks/:id/verify` on the broken seed task | "This task is missing a title on purpose. Verify still runs, but returns 422 instead of crashing the server." |
| 10 | Open `data/tasks.json` in the editor | "This proves persistence — the file itself was updated, not just an in-memory array." |
| 11 | Open `http://localhost:3000/` in a browser | "The static frontend fetches `/tasks` and renders it; the Refresh button re-fetches on demand." |
| 12 | Send a malformed JSON body (or hit an unknown route) | "This error doesn't crash the server — it flows through `next(err)` to the centralized error handler." |
| 13 | Show `middleware/errorHandler.js` | "One function, registered last, handles every error in the app — 404s, validation errors, malformed JSON, and unexpected failures — and always returns clean JSON, never a stack trace." |

---

## 6. Viva / Interview Questions

1. **What is Node.js?** A JavaScript runtime built on Chrome's V8 engine that lets JavaScript run outside the browser, e.g. on a server.
2. **What is Express?** A minimal web framework for Node.js that makes it easy to define routes and middleware for handling HTTP requests.
3. **What is middleware?** A function `(req, res, next)` that runs during the request/response cycle — it can inspect/modify the request, send a response, or call `next()` to pass control onward.
4. **Why do we use `next()`?** It hands control to the next middleware or route handler in the stack; without it, the request would hang.
5. **What is `req.params`?** An object holding route parameters, e.g. `:id` in `/tasks/:id` becomes `req.params.id`.
6. **What is `req.body`?** The parsed request body (here, JSON), made available by the `express.json()` middleware.
7. **What is REST?** An architectural style for APIs where resources (like tasks) are manipulated using standard HTTP methods and URLs.
8. **Why GET?** To retrieve data without changing anything on the server (a "safe" method).
9. **Why POST?** To create a new resource.
10. **Why PUT?** To update an existing resource.
11. **Why DELETE?** To remove a resource.
12. **Why 201 on creation?** It specifically means "a new resource was created," which is more precise than a generic 200.
13. **Why 204 on delete?** "No Content" — the deletion succeeded and there's nothing meaningful to return in the body.
14. **Why 400 on bad input?** It tells the client the *request itself* was invalid (e.g. missing title), as opposed to a server-side problem.
15. **Why 404?** The requested resource (a task id, or a route) doesn't exist.
16. **What is a Promise?** An object representing the eventual result (or failure) of an asynchronous operation.
17. **Why async/await?** It lets asynchronous code (like file I/O or a delay) be written and read like synchronous code, which is easier to follow than chained `.then()` calls.
18. **Why not synchronous file operations?** Synchronous calls (`fs.readFileSync`) block Node's single thread, freezing the whole server while the disk operation runs; async versions don't.
19. **What is `fs.promises`?** The Promise-based version of Node's built-in file system module, used here with `await` instead of callbacks.
20. **Why `JSON.parse`?** To convert the raw text read from `tasks.json` into a real JavaScript array/object.
21. **Why `JSON.stringify`?** To convert the in-memory JavaScript array back into text before writing it to the file.
22. **Why UUID?** To generate a unique, collision-resistant identifier for each task without needing a database's auto-increment id.
23. **Why centralized error handling?** It keeps error formatting in one place instead of repeating `res.status(...).json({error...})` in every route, and guarantees a consistent response shape.
24. **Why use `next(err)`?** It tells Express "this failed — skip to the error-handling middleware" instead of continuing normally.
25. **Why must the error middleware be last?** Express matches middleware in registration order; an error handler can only catch errors from things registered *before* it.
26. **What happens when malformed JSON is received?** `express.json()` throws a `SyntaxError`, which Express automatically forwards to the error-handling middleware, which responds with 400.
27. **Why shouldn't stack traces be returned to clients?** They can reveal internal file paths, library versions, or logic that attackers could exploit; they're logged on the server instead.
28. **Why use `tasks.json` instead of a database?** The assignment scope is to demonstrate `fs.promises` and simple persistence, not database integration — a JSON file is enough to prove the concept.
29. **How does persistence work here?** Every write operation (`POST`/`PUT`/`DELETE`) calls `writeTasks()`, which serializes the current tasks array and overwrites `tasks.json`, so the next `readTasks()` (even after a restart) sees the change.
30. **How does `express.static` work?** It serves files from a given folder (here, `public/`) directly over HTTP, matching request paths to filenames — so `GET /` serves `public/index.html`.

---

## 7. Final Requirements Checklist

**STAGE 1**
- [x] Node project initialized with npm
- [x] Express installed
- [x] UUID installed
- [x] Server created, listens on configurable `PORT` (default 3000)
- [x] Logger middleware (method, path, timestamp) on every request
- [x] `GET /tasks`
- [x] `GET /tasks/:id`
- [x] `POST /tasks`
- [x] `PUT /tasks/:id`
- [x] `DELETE /tasks/:id`

**STAGE 2**
- [x] `GET /tasks/:id/verify` endpoint
- [x] Promise-based delay helper (`wait(ms)`) using `setTimeout`
- [x] Route uses `async/await`, no `.then()` chains
- [x] Deliberately broken task in seed data (missing `title`)
- [x] Broken task fails verification gracefully (no crash)

**STAGE 3**
- [x] `data/tasks.json` replaces the in-memory array
- [x] `fs/promises` + `async/await` for all reads/writes
- [x] `readTasks()` / `writeTasks()` helpers, no duplicated logic
- [x] Changes survive a server restart
- [x] Correct status codes: 200 / 201 / 204 / 400 / 404
- [x] POST/PUT validation (title required, non-empty, string; complete must be boolean)
- [x] `public/index.html` static frontend using Fetch API
- [x] `express.static` serves `public/`

**STAGE 4**
- [x] `middleware/errorHandler.js` created
- [x] Exactly one centralized error-handling middleware, registered last
- [x] Routes forward errors via `next(err)` instead of responding directly
- [x] Malformed JSON handled and returns 400
- [x] Unknown routes return a clean JSON 404
- [x] No raw stack traces returned to clients (logged server-side only)
- [x] Server survives all tested bad requests
