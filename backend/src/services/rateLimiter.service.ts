import { redisClient } from '../config/redis';
import { config } from '../config';

export interface RateLimitCheckResult {
  allowed: boolean;
  reason?: 'RATE_LIMIT_EXCEEDED' | 'MIN_DELAY_VIOLATED';
  rescheduleDelayMs?: number;
  nextAvailableDate?: Date;
  windowKey?: string;
  currentCount?: number;
}

export function getHourKey(senderId: string, date = new Date()): string {
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  const hh = String(date.getUTCHours()).padStart(2, '0');
  return `rate-limit:${senderId}:${yyyy}-${mm}-${dd}-${hh}`;
}

export function getNextHourWindowDate(now = new Date()): Date {
  const next = new Date(now.getTime());
  next.setUTCHours(next.getUTCHours() + 1, 0, 0, 0);
  return next;
}

export async function checkAndRecordRateLimit(
  senderId: string,
  maxEmailsPerHour = config.maxEmailsPerHour,
  minDelayMs = config.minEmailDelayMs
): Promise<RateLimitCheckResult> {
  const now = new Date();
  const nowMs = now.getTime();
  const nextHourDate = getNextHourWindowDate(now);
  const nextHourMs = nextHourDate.getTime();
  const lastSentKey = `email-last-sent:${senderId}`;
  const hourKey = getHourKey(senderId, now);
  const hourKeyTtlSeconds = 7200;
  const lastSentTtlMs = 86400000;

  const lua = `
    local lastSent = redis.call('GET', KEYS[1])
    local nowMs = tonumber(ARGV[1])
    local minDelayMs = tonumber(ARGV[2])
    local maxPerHour = tonumber(ARGV[3])
    local nextHourMs = tonumber(ARGV[4])
    local hourKeyTtlSeconds = tonumber(ARGV[5])
    local lastSentTtlMs = tonumber(ARGV[6])

    if lastSent then
      local elapsedMs = nowMs - tonumber(lastSent)
      if elapsedMs < minDelayMs then
        return {0, 'MIN_DELAY_VIOLATED', minDelayMs - elapsedMs, 0, redis.call('GET', KEYS[2]) or 0}
      end
    end

    local currentCount = tonumber(redis.call('GET', KEYS[2]) or '0')
    if currentCount >= maxPerHour then
      return {0, 'RATE_LIMIT_EXCEEDED', nextHourMs - nowMs, nextHourMs, currentCount}
    end

    currentCount = redis.call('INCR', KEYS[2])
    if currentCount == 1 then
      redis.call('EXPIRE', KEYS[2], hourKeyTtlSeconds)
    end

    redis.call('SET', KEYS[1], tostring(nowMs), 'PX', lastSentTtlMs)
    return {1, '', 0, 0, currentCount}
  `;

  const result = (await redisClient.eval(
    lua,
    2,
    lastSentKey,
    hourKey,
    nowMs,
    minDelayMs,
    maxEmailsPerHour,
    nextHourMs,
    hourKeyTtlSeconds,
    lastSentTtlMs
  )) as [number, string, number, number, number];

  const [allowed, reason, delayMs, nextAvailableMs, currentCount] = result;

  if (allowed === 1) {
    return { allowed: true, windowKey: hourKey, currentCount };
  }

  const normalizedDelay = Math.max(Number(delayMs) || 0, reason === 'RATE_LIMIT_EXCEEDED' ? 1000 : 500);

  return {
    allowed: false,
    reason: reason as RateLimitCheckResult['reason'],
    rescheduleDelayMs: normalizedDelay,
    nextAvailableDate: nextAvailableMs ? new Date(Number(nextAvailableMs)) : undefined,
    windowKey: hourKey,
    currentCount: Number(currentCount) || 0,
  };
}

export async function recordEmailSentTimestamp(senderId: string): Promise<void> {
  const lastSentKey = `email-last-sent:${senderId}`;
  await redisClient.set(lastSentKey, Date.now().toString(), 'PX', 86400000);
}

export async function claimRateLimitNotification(senderId: string, windowKey: string): Promise<boolean> {
  const notifyKey = `rate-limit-notified:${senderId}:${windowKey}`;
  const result = await redisClient.set(notifyKey, Date.now().toString(), 'EX', 7200, 'NX');
  return result === 'OK';
}
