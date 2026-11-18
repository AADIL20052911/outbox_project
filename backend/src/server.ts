import app from './app';
import { config } from './config';
import { setupEmailWorker } from './queue/email.worker';
import { emailQueue } from './queue/email.queue';
import { closeRedisConnection } from './config/redis';
import { disconnectPrisma } from './services/prisma.service';
import { closeElasticsearchClient } from './config/elasticsearch';
import { ensureEmailsIndexExists } from './services/elasticsearch.service';

let workerInstance: any = null;

const server = app.listen(config.port, async () => {
  console.log(`[ReachInbox Server] Running on http://localhost:${config.port}`);
  console.log(`[Bull Board] Admin Queue UI available at http://localhost:${config.port}/admin/queues`);

  
  await ensureEmailsIndexExists();

  
  try {
    workerInstance = setupEmailWorker();
    console.log(`[BullMQ Worker] Initialized with concurrency: ${config.workerConcurrency}`);
  } catch (err) {
    console.warn('[BullMQ Worker] Launch warning (Redis offline in dev mode):', (err as Error).message);
  }
});


let isShuttingDown = false;

async function handleGracefulShutdown(signal: string) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`\n[Server Shutdown] Received ${signal}. Starting graceful shutdown sequence...`);

  
  server.close(async (err) => {
    if (err) {
      console.error('[Server Shutdown] Error closing Express server:', err);
    } else {
      console.log('[Server Shutdown] Express HTTP server closed.');
    }

    try {
      
      if (workerInstance) {
        console.log('[Server Shutdown] Closing BullMQ worker...');
        await workerInstance.close();
        console.log('[Server Shutdown] BullMQ worker closed.');
      }

      
      console.log('[Server Shutdown] Closing BullMQ queue...');
      await emailQueue.close();

      
      console.log('[Server Shutdown] Closing Redis connection...');
      await closeRedisConnection();

      
      console.log('[Server Shutdown] Disconnecting Prisma Client...');
      await disconnectPrisma();

      
      console.log('[Server Shutdown] Closing Elasticsearch client...');
      await closeElasticsearchClient();

      console.log('[Server Shutdown] All services gracefully terminated. Exiting process.');
      process.exit(0);
    } catch (shutdownErr) {
      console.error('[Server Shutdown] Error during graceful shutdown cleanup:', shutdownErr);
      process.exit(1);
    }
  });

  
  setTimeout(() => {
    console.error('[Server Shutdown] Forced exit due to shutdown timeout.');
    process.exit(1);
  }, 10000);
}

process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));
process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));

export default server;
