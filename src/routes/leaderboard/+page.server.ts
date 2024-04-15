import { redis } from '$lib/server/redis';

export const load = async ({ locals }) => {
	try {
		let combinedData;

		// Try to load combinedData from Redis cache
		const cachedCombinedData = await redis.get('combinedData');
		if (cachedCombinedData) {
			combinedData = JSON.parse(cachedCombinedData);
		} else {
			const { data: netWorthData, error: netWorthError } =
				await locals.supabase.rpc('calculate_net_worth');
			if (netWorthError) throw netWorthError;

			const { data: pnlData, error: pnlError } = await locals.supabase.rpc('calculate_pnl');
			if (pnlError) throw pnlError;

			const { data: tradeCountData, error: tradeCountError } =
				await locals.supabase.rpc('calculate_trade_count');
			if (tradeCountError) throw tradeCountError;

			// Combine data based on user_id
			combinedData = netWorthData.map((netWorthItem: { user_id: any }) => {
				const pnlItem = pnlData.find((p: { user_id: any }) => p.user_id === netWorthItem.user_id);
				const tradeCountItem = tradeCountData.find(
					(t: { user_id: any }) => t.user_id === netWorthItem.user_id
				);

				return {
					...netWorthItem,
					pnl: pnlItem ? pnlItem.pnl : null,
					trade_count: tradeCountItem ? tradeCountItem.trade_count : null
				};
			});

			// Set the data in Redis cache with a 10-minute expiration
			await redis.set('combinedData', JSON.stringify(combinedData), 'EX', 600);
		}

		return { leaderboardData: combinedData };
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
