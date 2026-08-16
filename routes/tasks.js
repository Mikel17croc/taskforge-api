// routes/tasks.js
//
// STAGE 4: routes no longer send their own error JSON responses. Instead,
// every error path calls next(err) so the request reaches the single
// centralized error handler in middleware/errorHandler.js. Success
// responses are still sent directly from each route.

const express = require('express');
const path = require('path');
const fs = require('fs/promises');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

const TASKS_FILE = path.join(__dirname, '..', 'data', 'tasks.json');

// Reads tasks.json and returns the parsed array of tasks.
async function readTasks() {
  const raw = await fs.readFile(TASKS_FILE, 'utf-8');
  return JSON.parse(raw);
}

// Writes the given tasks array back to tasks.json as formatted JSON.
async function writeTasks(tasks) {
  await fs.writeFile(TASKS_FILE, JSON.stringify(tasks, null, 2), 'utf-8');
}

// Returns a Promise that resolves after `ms` milliseconds.
// Used by /verify to simulate a slow external check.
function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Checks whether a title is valid: must be a non-empty string.
function isValidTitle(title) {
  return typeof title === 'string' && title.trim().length > 0;
}

// Builds an Error object carrying an HTTP status, for next(err) to use.
// err.expose marks the message as safe to show to the client (as opposed
// to an unexpected 500 whose real message should stay in the server logs).
function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  err.expose = true;
  return err;
}

// GET /tasks - return every task
router.get('/', async (req, res, next) => {
  try {
    const tasks = await readTasks();
    res.status(200).json(tasks);
  } catch (err) {
    next(err);
  }
});

// GET /tasks/:id - return a single task
router.get('/:id', async (req, res, next) => {
  try {
    const tasks = await readTasks();
    const task = tasks.find((t) => t.id === req.params.id);

    if (!task) {
      return next(httpError(404, 'Task not found'));
    }

    res.status(200).json(task);
  } catch (err) {
    next(err);
  }
});

// GET /tasks/:id/verify - simulate a slow external verification check
router.get('/:id/verify', async (req, res, next) => {
  try {
    const tasks = await readTasks();
    const task = tasks.find((t) => t.id === req.params.id);

    if (!task) {
      return next(httpError(404, 'Task not found'));
    }

    // Simulate a slow external service by waiting 1-2 seconds.
    const delay = 1000 + Math.floor(Math.random() * 1000);
    await wait(delay);

    if (!isValidTitle(task.title)) {
      // 422 Unprocessable Entity: the task exists but fails verification.
      return next(httpError(422, 'Task failed verification: missing or invalid title'));
    }

    res.status(200).json({
      id: task.id,
      verified: true,
      message: 'Task verified successfully',
    });
  } catch (err) {
    next(err);
  }
});

// POST /tasks - create a new task
router.post('/', async (req, res, next) => {
  try {
    const { title } = req.body || {};

    if (!isValidTitle(title)) {
      return next(httpError(400, 'Title is required and must be a non-empty string'));
    }

    const tasks = await readTasks();

    const newTask = {
      id: uuidv4(),
      title: title.trim(),
      complete: false,
      createdAt: new Date().toISOString(),
    };

    tasks.push(newTask);
    await writeTasks(tasks);

    res.status(201).json(newTask);
  } catch (err) {
    next(err);
  }
});

// PUT /tasks/:id - update an existing task
router.put('/:id', async (req, res, next) => {
  try {
    const tasks = await readTasks();
    const task = tasks.find((t) => t.id === req.params.id);

    if (!task) {
      return next(httpError(404, 'Task not found'));
    }

    const { title, complete } = req.body || {};

    if (title !== undefined && !isValidTitle(title)) {
      return next(httpError(400, 'Title must be a non-empty string'));
    }

    if (complete !== undefined && typeof complete !== 'boolean') {
      return next(httpError(400, 'Complete must be a boolean'));
    }

    if (title !== undefined) task.title = title.trim();
    if (complete !== undefined) task.complete = complete;

    await writeTasks(tasks);
    res.status(200).json(task);
  } catch (err) {
    next(err);
  }
});

// DELETE /tasks/:id - remove a task
router.delete('/:id', async (req, res, next) => {
  try {
    const tasks = await readTasks();
    const index = tasks.findIndex((t) => t.id === req.params.id);

    if (index === -1) {
      return next(httpError(404, 'Task not found'));
    }

    tasks.splice(index, 1);
    await writeTasks(tasks);

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
