/**
 * Standard API response helpers.
 * Shape: { success, data?, error?, meta? }
 */

export function success(res, data = null, meta = undefined, status = 200) {
  const body = { success: true };
  if (data !== undefined && data !== null) body.data = data;
  if (meta !== undefined) body.meta = meta;
  return res.status(status).json(body);
}

export function created(res, data, meta) {
  return success(res, data, meta, 201);
}

export function noContent(res) {
  return res.status(204).send();
}

export function fail(res, status, code, message, details) {
  const error = { code, message };
  if (details !== undefined) error.details = details;
  return res.status(status).json({ success: false, error });
}
