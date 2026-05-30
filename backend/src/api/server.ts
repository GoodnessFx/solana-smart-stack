import fastify from 'fastify';
import cors from '@fastify/cors';
import { logger } from '../logger';

export async function setupServer(port: number, routes: any) {
  const server = fastify({
    logger: false // We use our own logger
  });

  await server.register(cors, {
    origin: true
  });

  server.get('/health', async () => {
    return { status: 'ok', timestamp: Date.now() };
  });

  server.get('/api/stats', async () => {
    return routes.getStats();
  });

  server.get('/api/history', async (request: any) => {
    const limit = parseInt((request.query as any).limit || '20');
    return routes.getHistory(limit);
  });

  server.get('/api/bundles', async () => {
    return routes.getAllBundles();
  });

  server.post('/api/submit', async (request: any) => {
    const { transactions } = request.body as any;
    return routes.submitBundle(transactions);
  });

  server.get('/api/export-log', async (request, reply) => {
    const csv = await routes.exportLog();
    reply
      .header('Content-Type', 'text/csv')
      .header('Content-Disposition', 'attachment; filename=lifecycle_log.csv')
      .send(csv);
  });

  try {
    await server.listen({ port, host: '0.0.0.0' });
    logger.info(`Server listening on port ${port}`);
  } catch (err) {
    logger.error('Failed to start server', err);
    process.exit(1);
  }
}
