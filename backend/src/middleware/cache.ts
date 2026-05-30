// backend/src/middleware/cache.ts
// Simple in‑memory cache for Fastify routes using node‑cache.
// Used to cache /api/stats for 5 seconds.

import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 5, checkperiod: 10 });

/**
 * Wrap a route handler with caching.
 * @param keyCacheKey Function that returns a cache key based on request (for /api/stats a static key).
 * @param handler Original async handler returning data.
 */
export function withCache<T>(cacheKey: string, handler: () => Promise<T>) {
  return async () => {
    const cached = cache.get<T>(cacheKey);
    if (cached !== undefined) {
      return cached;
    }
    const result = await handler();
    cache.set(cacheKey, result);
    return result;
  };
}
