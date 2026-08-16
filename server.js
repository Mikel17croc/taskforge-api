// server.js
//
// Entry point for the TaskForge API.
// STAGE 4: centralized error handling.
//
// Middleware order matters here:
//   1. express.json()   - parses bodies; malformed JSON raises a SyntaxError
//                          that Express forwards straight to the error
//                          handler, no matter where it's registered.
//   2. logger            - logs every request.
//   3. express.static     - serves the public/ frontend.
//   4. /tasks router      - all API routes; errors go through next(err).
//   5. 404 handler        - catches any request that didn't match a route.
//   6. errorHandler       - MUST be last. Express only treats a 4-argument
//                          function as an error handler, and it only
//                          receives requests that reached a next(err) call.

const path = require('path');
const express = require('express');
const logger = require('./middleware/logger');
const tasksRouter = require('./routes/tasks');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// Parse JSON request bodies before routes need req.body.
app.use(express.json());

// Global logging middleware - runs for every request.
app.use(logger);

// Serve the vanilla JS frontend from /public (e.g. public/index.html at "/").
app.use(express.static(path.join(__dirname, 'public')));

// All /tasks routes are handled by routes/tasks.js.
app.use('/tasks', tasksRouter);

// Anything that falls through to here didn't match a route or a static
// file. Respond with clean JSON instead of Express's default HTML page.
app.use((req, res, next) => {
  const err = new Error('Route not found');
  err.status = 404;
  err.expose = true;
  next(err);
});

// Centralized error handler - registered last on purpose (see notes above).
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`TaskForge API running on http://localhost:${PORT}`);
});
