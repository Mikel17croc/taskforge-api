// middleware/errorHandler.js
//
// STAGE 4: the ONE centralized error-handling middleware.
// Express recognizes this as an error handler because it takes 4 arguments
// (err, req, res, next). It must be registered LAST, after every other
// app.use()/route, so that any next(err) call - from routes, from
// express.json()'s malformed-JSON error, or from the 404 handler - ends up
// here.

function errorHandler(err, req, res, next) {
  // Log the full error (including stack trace) on the server for debugging.
  // The stack trace itself is never sent back to the client.
  console.error(err.stack || err);

  // express.json() throws a SyntaxError with a "body-parser" type when the
  // request body is malformed JSON. Treat that as a 400, not a 500.
  const isMalformedJson =
    err.type === 'entity.parse.failed' || err instanceof SyntaxError;

  const status = isMalformedJson ? 400 : err.status || 500;

  const message = isMalformedJson
    ? 'Malformed JSON in request body'
    : err.expose
      ? err.message
      : status === 500
        ? 'Internal Server Error'
        : err.message;

  res.status(status).json({ error: message });
}

module.exports = errorHandler;
