import { redis } from '$lib/server/redis';
import { supabase } from '$lib/server/supabase';

async function initializeLeaderboard() {
	const { data, error } = await supabase.rpc('calculate_leaderboard_data_v2');

	if (error) {
		console.error('Failed to fetch leaderboard data:', error);
		return;
	}

	const pipeline = redis.pipeline();

	data.map(
		async (user: {
			user_id: string;
			username: string;
			avatar_url: string;
			net_worth: string;
			pnl: string;
			trade_count: string;
		}) => {
			pipeline.hmset(`${user.user_id}`, {
				username: user.username,
				avatar_url: user.avatar_url,
				net_worth: parseFloat(user.net_worth).toFixed(2),
				pnl: parseFloat(user.pnl).toFixed(2),
				trade_count: user.trade_count.toString()
			});

			pipeline.zadd('leaderboard', {
				score: Number(parseFloat(user.pnl).toFixed(2)),
				member: `${user.user_id}`
			});
		}
	);

	await pipeline.exec();
	await redis.expire('leaderboard', 3600);

	console.log('Leaderboard initialized successfully!');
}

export const load = async () => {
	try {
		const leaderboardExists = await redis.exists('leaderboard');

		if (!leaderboardExists) {
			await initializeLeaderboard();
		}

		const leaderboardUserIds = await redis.zrange('leaderboard', 0, 99, {
			rev: true
		});

		const formattedData = await Promise.all(
			leaderboardUserIds.map(async (userId) => {
				const userDetails = await redis.hgetall(`${userId}`);
				return {
					rank: leaderboardUserIds.indexOf(userId) + 1,
					username: userDetails?.username,
					avatar_url: userDetails?.avatar_url,
					net_worth: Number(userDetails?.net_worth),
					pnl: Number(userDetails?.pnl),
					trade_count: parseInt(userDetails?.trade_count as string, 10)
				};
			})
		);

		return { leaderboardData: formattedData };
	} catch (error) {
		console.error('Error fetching leaderboard data:', error);
		return { leaderboardData: [] };
	}
};
