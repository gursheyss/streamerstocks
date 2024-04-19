import cron from 'node-cron';
import { redis } from '$lib/server/redis';
import { supabase } from '$lib/server/supabase';
import { error } from '@sveltejs/kit';

// Helper function to load initial leaderboard data into Redis
async function initializeLeaderboard() {
	console.log('Initializing leaderboard...');

	const { data, error } = await supabase.rpc('calculate_leaderboard_data_v2');

	if (error) {
		console.error('Failed to fetch leaderboard data:', error);
		return;
	}

	// Clear previous leaderboard data
	await redis.del('leaderboard');

	// Populate Redis sorted set with pnl data
	const updates = data.map(
		async (user: {
			user_id: any;
			username: any;
			avatar_url: any;
			net_worth: string;
			pnl: string;
			trade_count: { toString: () => any };
		}) => {
			await redis.hmset(`${user.user_id}`, {
				username: user.username,
				avatar_url: user.avatar_url,
				net_worth: parseFloat(user.net_worth).toFixed(2),
				pnl: parseFloat(user.pnl).toFixed(2),
				trade_count: user.trade_count.toString()
			});

			// Add user to the sorted set by pnl
			await redis.zadd('leaderboard', parseFloat(user.pnl).toFixed(2), `${user.user_id}`);
		}
	);

	await Promise.all(updates);

	console.log('Leaderboard initialized successfully!');
}
// Updates leaderboard every 5 minutes
cron.schedule(
	'*/5 * * * *',
	() => {
		initializeLeaderboard();
	},
	{
		scheduled: true,
		timezone: 'America/New_York'
	}
);

export const load = async ({ params }) => {
	try {
		// Fetch leaderboard data from Redis
		// await initializeLeaderboard();

		const limit = parseInt(params.limit, 10);
		const skip = parseInt(params.skip, 10);

		try {
			const start = skip;
			const end = skip + limit - 1;
			let leaderboardUserIds = await redis.zrevrange('leaderboard', start, end);

			const formattedData = await Promise.all(
				leaderboardUserIds.map(async (userId) => {
					const userDetails = await redis.hgetall(userId);
					return {
						rank: start + leaderboardUserIds.indexOf(userId) + 1,
						username: userDetails.username,
						avatar_url: userDetails.avatar_url,
						net_worth: Number(userDetails.net_worth),
						pnl: Number(userDetails.pnl),
						trade_count: parseInt(userDetails.trade_count, 10)
					};
				})
			);
			const totalEntries = await redis.zcard('leaderboard');
			const hasNextPage = end < totalEntries - 1;
			const hasPrevPage = start > 0;

			return {
				leaderboardData: formattedData,
				nextPage: hasNextPage ? skip + limit : null,
				prevPage: hasPrevPage ? Math.max(0, skip - limit) : null
			};
		} catch (err) {
			throw error(500, `Failed to fetch leaderboard data: ${err.message}`);
		}
	} catch (error) {
		return {
			status: 500,
			body: {
				error: error.message
			}
		};
	}
};
