import { FastifyInstance, FastifyError, FastifyReply, FastifyRequest } from 'fastify';

/**
 * Custom application error class with an HTTP status code and optional payload.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly payload?: any;

  constructor(message: string, statusCode: number = 500, payload?: any) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.payload = payload;
    // Ensure prototype chain is correct (required when extending built‑ins)
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Fastify plugin that registers a global error handler.
 * It converts any thrown AppError into an HTTP response with the appropriate status
 * code and payload. All other errors default to a 500 response.
 */
export async function errorHandler(fastify: FastifyInstance) {
  fastify.setErrorHandler((error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
    if (error instanceof AppError) {
      const response = {
        error: error.name,
        message: error.message,
        ...(error.payload ? { payload: error.payload } : {})
      };
      reply.status(error.statusCode).send(response);
    } else {
      // Log unexpected errors
      fastify.log.error(error);
      reply.status(500).send({ error: 'InternalServerError', message: 'An unexpected error occurred.' });
    }
  });
}
