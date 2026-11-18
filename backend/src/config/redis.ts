import Redis from 'ioredis';
import { config } from './index';

export const redisClient = new Redis(config.redisUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

redisClient.on('error', (err) => {
  console.warn('[Redis] Connection warning/error:', err.message);
});

export async function closeRedisConnection(): Promise<void> {
  try {
    await redisClient.quit();
    console.log('[Redis] Connection closed.');
  } catch (err) {
    console.error('[Redis] Error during quit:', err);
  }
}
