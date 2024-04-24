import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';
import { UPSTASH_REDIS_TOKEN, UPSTASH_REDIS_URL } from '$env/static/private';

export const redis = new Redis({
	url: UPSTASH_REDIS_URL,
	token: UPSTASH_REDIS_TOKEN
});

export const ratelimit = new Ratelimit({
	redis: redis,
	limiter: Ratelimit.slidingWindow(1, '10s'),
	prefix: '@upstash/ratelimit'
});
