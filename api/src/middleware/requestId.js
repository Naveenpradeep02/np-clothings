/**
 * Assign X-Request-Id for log correlation.
 */
import { randomUUID } from 'node:crypto';

export function requestId(req, res, next) {
  const incoming = req.headers['x-request-id'];
  const id =
    typeof incoming === 'string' && incoming.length > 0 && incoming.length < 128
      ? incoming
      : randomUUID();
  req.requestId = id;
  res.setHeader('X-Request-Id', id);
  next();
}

export default requestId;
