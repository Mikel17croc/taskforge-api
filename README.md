# TaskForge API

## Project Description

TaskForge API is a small REST API, built with Node.js and Express, for
managing a list of tasks. Each task has a title, a completion flag, and a
creation timestamp. Tasks are persisted to a JSON file on disk, and a tiny
vanilla-JavaScript frontend displays them in the browser. The project also
includes an async "verification" endpoint that simulates a slow external
check, and a single centralized error-handling middleware that turns every
error in the app into a clean JSON response.

## Learning Objectives

This project demonstrates:

- Node.js and NPM project setup
- Express routing and `express.Router()`
- Custom middleware (logging) and middleware ordering
- REST API design (proper HTTP methods and status codes)
- Promises, `async/await`, and simulating delayed operations
- `fs/promises` for non-blocking file persistence
- JSON parsing/serialization
- Serving a static frontend with `express.static`
- Centralized error handling with `next(err)`

## Technologies

- Node.js
- Express
- uuid (for generating task IDs)
- Node's built-in `fs/promises` module
- Plain HTML/CSS/JavaScript for the frontend (no frontend framework)

## Installation

```powershell
git clone <your-repo-url>
cd taskforge-api
npm install
```

## Running

```powershell
npm start
```

## Server

By default the server listens on **port 3000**. You can override this with
the `PORT` environment variable:

```powershell
$env:PORT=4000; npm start
```

Once running, open **http://localhost:3000/** in a browser to see the
frontend, or use Postman/Thunder Client/curl against the API routes below.

## API Routes

| Method | Endpoint            | Description                              | Success Status |
| ------ | -------------------- | ----------------------------------------- | --------------- |
| GET    | `/tasks`              | Get all tasks                             | 200 OK           |
| GET    | `/tasks/:id`           | Get a single task by id                   | 200 OK           |
| POST   | `/tasks`              | Create a new task                         | 201 Created      |
| PUT    | `/tasks/:id`           | Update an existing task                   | 200 OK           |
| DELETE | `/tasks/:id`           | Delete a task                             | 204 No Content   |
| GET    | `/tasks/:id/verify`    | Simulate a slow (1-2s) verification check | 200 OK           |

## Request Examples

**POST /tasks**
```json
{
  "title": "Write project documentation"
}
```

**PUT /tasks/:id**
```json
{
  "title": "Write project documentation",
  "complete": true
}
```

## Response Examples

**GET /tasks/:id** (200)
```json
{
  "id": "11111111-1111-4111-8111-111111111111",
  "title": "Set up the TaskForge project",
  "complete": true,
  "createdAt": "2026-08-16T09:00:00.000Z"
}
```

**GET /tasks/:id/verify** on a valid task (200, after a 1-2s delay)
```json
{
  "id": "11111111-1111-4111-8111-111111111111",
  "verified": true,
  "message": "Task verified successfully"
}
```

**GET /tasks/:id/verify** on the broken seed task (422)
```json
{
  "error": "Task failed verification: missing or invalid title"
}
```

**POST /tasks** with an empty title (400)
```json
{
  "error": "Title is required and must be a non-empty string"
}
```

## Error Handling

All errors - validation failures, missing tasks (404), malformed JSON
bodies, unknown routes, and unexpected filesystem errors - flow through a
single centralized error-handling middleware in `middleware/errorHandler.js`.

Routes never send their own error JSON. Instead they call `next(err)` (or
let a rejected Promise be caught and forwarded), and `errorHandler.js`:

1. Logs the full error (including stack trace) to the server console.
2. Picks an HTTP status (`err.status`, or 400 for malformed JSON, or 500 by
   default).
3. Sends back a clean `{ "error": "..." }` JSON body - never a raw stack
   trace.

The error handler is registered **last** in `server.js`, after the routes
and after the "unknown route" 404 handler, because Express only treats a
4-argument function `(err, req, res, next)` as error-handling middleware,
and it is only invoked once something calls `next(err)`.

## Persistence

Tasks are stored in `data/tasks.json`. `routes/tasks.js` has two small
helpers:

- `readTasks()` - reads and `JSON.parse`s the file (via `fs/promises`)
- `writeTasks(tasks)` - `JSON.stringify`s the array and writes it back

Every `POST`, `PUT`, and `DELETE` calls `writeTasks()` after modifying the
in-memory array, so changes are saved to disk immediately. To confirm this:

1. Create, update, or delete a task.
2. Stop the server (Ctrl+C).
3. Run `npm start` again.
4. `GET /tasks` - your change is still there, because it came from
   `data/tasks.json`, not from memory.

## Static Frontend

`public/index.html` is served automatically by `express.static` at
`http://localhost:3000/`. It uses the Fetch API to call `GET /tasks` and
renders each task's title, status, and creation date, with a **Refresh**
button to re-fetch.

## Testing

See `TESTS.md` for the full test plan (every endpoint, positive and
negative cases, exact curl/PowerShell commands, and expected status codes).
You can also test with:

- **Postman** or **Thunder Client** - import the routes above manually and
  send requests.
- **Browser** - open `http://localhost:3000/` to see the frontend, or
  `http://localhost:3000/tasks` to see the raw JSON.

## Git Development Stages

This project was built (and should be committed) in four stages:

1. **Stage 1** - Server and routing foundations (in-memory tasks, logger
   middleware, all five basic routes).
2. **Stage 2** - Async task verification (`/verify` endpoint with a
   simulated 1-2s delay, plus a deliberately broken seed task).
3. **Stage 3** - Persistent REST API (`data/tasks.json` via `fs/promises`),
   proper status codes, request validation, and the static frontend.
4. **Stage 4** - Centralized error handling (`middleware/errorHandler.js`,
   malformed-JSON handling, unknown-route handling).

## Project Structure

```
taskforge-api/
│
├── server.js
├── routes/
│   └── tasks.js
├── middleware/
│   ├── logger.js
│   └── errorHandler.js
├── data/
│   └── tasks.json
├── public/
│   └── index.html
├── package.json
├── package-lock.json
└── README.md
```

## Academic Notes

A few concepts worth being able to explain before a demo or viva:

- **Middleware** is just a function `(req, res, next)` that Express calls
  in order; calling `next()` passes control to the next one.
- **`async/await`** lets asynchronous code (file I/O, delays) read like
  synchronous code, while `try/catch` lets you forward any rejected Promise
  to `next(err)`.
- **`fs/promises`** never blocks the Node.js event loop, unlike
  `fs.readFileSync`/`fs.writeFileSync`.
- **Centralized error handling** means routes stay focused on business
  logic; all error formatting lives in one place.
