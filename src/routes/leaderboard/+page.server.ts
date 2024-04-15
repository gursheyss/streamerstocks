import cron from 'node-cron';
import { redis } from '$lib/server/redis';
import { supabase } from '$lib/server/supabase';

// Helper function to load initial leaderboard data into Redis
async function initializeLeaderboard() {
	console.log('Initializing leaderboard...');
	const { data: netWorthData, error: netWorthError } = await supabase.rpc('calculate_net_worth');
	if (netWorthError) {
		console.error('Failed to fetch net worth data:', netWorthError);
		return;
	}
	const { data: pnlData, error: pnlError } = await supabase.rpc('calculate_pnl');
	if (pnlError) {
		console.error('Failed to fetch PnL data:', pnlError);
		return;
	}

	const { data: tradeCountData, error: tradeCountError } =
		await supabase.rpc('calculate_trade_count');
	if (tradeCountError) {
		console.error('Failed to fetch trade count data:', tradeCountError);
		return;
	}
	// // Clear previous leaderboard data
	await redis.del('leaderboard');

	// Populate Redis sorted set with net worth data
	const updates = netWorthData.map(
		async (user: { user_id: any; username: any; avatar_url: any; net_worth: string }) => {
			const pnlItem = pnlData.find((p: { user_id: any }) => p.user_id === user.user_id);
			const tradeCountItem = tradeCountData.find(
				(t: { user_id: any }) => t.user_id === user.user_id
			);

			await redis.hmset(`${user.user_id}`, {
				username: user.username, // Assume these fields are included in the RPC response
				avatar_url: user.avatar_url,
				net_worth: parseFloat(user.net_worth).toFixed(2),
				pnl: pnlItem ? parseFloat(pnlItem.pnl).toFixed(2) : '0',
				trade_count: tradeCountItem ? tradeCountItem.trade_count.toString() : '0'
			});

			// Add user to the sorted set by net worth
			await redis.zadd('leaderboard', parseFloat(user.net_worth).toFixed(2), `${user.user_id}`);
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

export const load = async ({ locals }) => {
	try {
		// Fetch leaderboard data from Redis
		// await initializeLeaderboard();
		let leaderboardUserIds = await redis.zrevrange('leaderboard', 0, 29);

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

/*
CREATE OR REPLACE FUNCTION calculate_net_worth()
RETURNS TABLE (
  user_id uuid,
  username text,
  avatar_url text,
  net_worth numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.username,
    p.avatar_url,
    CAST(p.balance AS numeric) + COALESCE((SELECT SUM(CAST(quantity AS numeric) * CAST(m.price AS numeric))
                          FROM inventory i
                          JOIN market m ON m.id = i.stock_id
                          WHERE i.user_id = p.id), 0) AS net_worth
  FROM profiles p;
END; $$
LANGUAGE plpgsql STABLE;

*/

/*
CREATE OR REPLACE FUNCTION calculate_pnl()
RETURNS TABLE (
  user_id uuid,
  username text,
  avatar_url text,
  pnl numeric
) AS $$
DECLARE
  user_net_worth RECORD;
BEGIN
  FOR user_net_worth IN SELECT * FROM calculate_net_worth()
  LOOP
    RETURN QUERY
    SELECT 
      user_net_worth.user_id,
      user_net_worth.username,
      user_net_worth.avatar_url,
      CAST(user_net_worth.net_worth AS numeric) - (10000 + (SELECT COALESCE(SUM(CAST(amount_redeemed AS numeric)), 0) 
                                           FROM profiles 
                                           WHERE id = user_net_worth.user_id)) AS pnl;
  END LOOP;
END; $$
LANGUAGE plpgsql STABLE;
*.

/*
CREATE OR REPLACE FUNCTION calculate_trade_count()
RETURNS TABLE (
  user_id uuid,
  username text,
  avatar_url text,
  trade_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.username,
    p.avatar_url,
    COALESCE((SELECT COUNT(*)
              FROM trades t
              WHERE t.user_id = p.id), 0) AS trade_count
  FROM profiles p;
END; $$
LANGUAGE plpgsql STABLE;

*/
