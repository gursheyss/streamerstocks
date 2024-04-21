import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';
import { UPSTASH_REDIS_TOKEN, UPSTASH_REDIS_URL } from '$env/static/private';

const redis = new Redis({
	url: UPSTASH_REDIS_URL,
	token: UPSTASH_REDIS_TOKEN
});

export const ratelimit = {
	buysell: new Ratelimit({
		redis,
		prefix: 'ratelimit:create',
		limiter: Ratelimit.slidingWindow(1, '5s')
	})
};
