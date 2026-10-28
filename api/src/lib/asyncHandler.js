/**
 * Wrap async route handlers so rejected promises reach error middleware.
 * @param {(req, res, next) => Promise<unknown>} fn
 */
export function asyncHandler(fn) {
  return function wrapped(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
