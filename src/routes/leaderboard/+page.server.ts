import { redis } from '$lib/server/upstash';
import { supabase } from '$lib/server/supabase';

// Helper function to load initial leaderboard data into Redis
async function initializeLeaderboard() {
	const { data, error } = await supabase.rpc('calculate_leaderboard_data_v2');

	if (error) {
		console.error('Failed to fetch leaderboard data:', error);
		return;
	}

	data.map(
		async (user: {
			user_id: string;
			username: string;
			avatar_url: string;
			net_worth: string;
			pnl: string;
			trade_count: string;
		}) => {
			await redis.hmset(`${user.user_id}`, {
				username: user.username,
				avatar_url: user.avatar_url,
				net_worth: parseFloat(user.net_worth).toFixed(2),
				pnl: parseFloat(user.pnl).toFixed(2),
				trade_count: user.trade_count.toString()
			});

			// Add user to the sorted set by pnl
			await redis.zadd('leaderboard', {
				score: Number(parseFloat(user.pnl).toFixed(2)),
				member: `${user.user_id}`
			});
		}
	);

	console.log('Leaderboard initialized successfully!');
}

export const load = async () => {
	try {
		// Fetch leaderboard data from Redis
		await initializeLeaderboard();

		const leaderboardUserIds = await redis.zrange('leaderboard', 0, 99, {
			rev: true
		});

		const formattedData = await Promise.all(
			leaderboardUserIds.map(async (userId) => {
				const userDetails = await redis.hgetall(`${userId}`);
				return {
					rank: leaderboardUserIds.indexOf(userId) + 1,
					username: userDetails.username,
					avatar_url: userDetails.avatar_url,
					net_worth: Number(userDetails.net_worth),
					pnl: Number(userDetails.pnl),
					trade_count: parseInt(userDetails.trade_count, 10)
				};
			})
		);

		// console.log('Formatted leaderboard data:', formattedData);
		return { leaderboardData: formattedData };
	} catch (error) {
		console.error('Error fetching leaderboard data:', error);
		return { leaderboardData: [] };
	}
};
