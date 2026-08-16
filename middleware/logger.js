// middleware/logger.js
//
// A tiny global logging middleware. Express calls this for every incoming
// request because it is registered with app.use() before any routes.
// It must call next() so the request keeps moving through the pipeline.

function logger(req, res, next) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);
  next();
}

module.exports = logger;
