import { redis } from '$lib/server/redis';
import { supabase } from '$lib/server/supabase';

// Helper function to load initial leaderboard data into Redis
async function initializeLeaderboard() {
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
	// Populate Redis sorted set with net worth data
	for (const user of netWorthData) {
		const cleaned_user_id = user.user_id.replace('user:', '');
		const pnlItem = pnlData.find((p) => p.user_id === user.user_id);
		const tradeCountItem = tradeCountData.find((t) => t.user_id === user.user_id);

		await redis.hmset(`${user.user_id}`, {
			net_worth: parseFloat(user.net_worth).toFixed(2),
			pnl: pnlItem ? parseFloat(pnlItem.pnl).toFixed(2) : '0',
			trade_count: tradeCountItem ? tradeCountItem.trade_count : '0'
		});

		// Add user to the sorted set by net worth
		await redis.zadd('leaderboard', parseFloat(user.net_worth).toFixed(2), cleaned_user_id);
	}
}

export const load = async ({ locals }) => {
	try {
		// Initialize leaderboard data in Redis if not already present
		const isInitialized = await redis.exists('leaderboard');
		if (!isInitialized) {
			await initializeLeaderboard();
		}

		// Fetch leaderboard data from Redis
		const leaderboardUserIds = await redis.zrevrange('leaderboard', 0, 9);
		const formattedData = await Promise.all(
			leaderboardUserIds.map(async (userId) => {
				const userDetails = await redis.hgetall(`user:${userId}`);
				return {
					rank: leaderboardUserIds.indexOf(userId) + 1,
					user_id: userId,
					username: userDetails.username,
					avatar_url: userDetails.avatar_url,
					net_worth: userDetails.net_worth,
					pnl: userDetails.pnl,
					trade_count: parseInt(userDetails.trade_count, 10)
				};
			})
		);

		console.log('Formatted leaderboard data:', formattedData);
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
