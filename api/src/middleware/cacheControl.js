/**
 * Cache-Control helpers for public read endpoints.
 */

export function publicCache(seconds = 60) {
  return (req, res, next) => {
    if (req.method === 'GET') {
      res.setHeader(
        'Cache-Control',
        `public, max-age=${seconds}, stale-while-revalidate=${Math.min(seconds * 2, 300)}`
      );
    }
    next();
  };
}

export function noStore(req, res, next) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  next();
}

export default { publicCache, noStore };
