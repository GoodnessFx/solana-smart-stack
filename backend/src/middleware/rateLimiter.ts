// backend/src/middleware/rateLimiter.ts
// Simple rate limiting using fastify-rate-limit (or a custom implementation).

import fastifyRateLimit from '@fastify/rate-limit';

/**
 * Register rate limiting plugin.
 * Default: 10 requests per second per IP.
 * Can be overridden via ENV variables RATE_LIMIT_MAX and RATE_LIMIT_WINDOW_MS.
 */
export async function registerRateLimiter(app: any) {
  const max = parseInt(process.env.RATE_LIMIT_MAX || '10', 10);
  const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '1000', 10);

  await app.register(fastifyRateLimit, {
    max,
    timeWindow: windowMs,
    errorResponseBuilder: function (request, context) {
      return {
        error: 'Too Many Requests',
        code: 'ERR_RATE_LIMIT',
        retryAfter: Math.ceil(context.ttl / 1000),
      };
    },
  });
}

export default registerRateLimiter;
