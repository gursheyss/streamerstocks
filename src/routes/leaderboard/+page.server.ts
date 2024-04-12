export const load = async ({ locals }) => {
	const { data, error } = await locals.supabase.rpc('calculate_pnl_with_networth');
	if (error) {
		console.error('Error fetching PnL:', error);
		return { leaderboard: [] };
	}

	return { marketData: data };
};

/*

SQL function calculate_pnl_with_networth():

DROP FUNCTION IF EXISTS calculate_pnl_with_networth;

CREATE OR REPLACE FUNCTION calculate_pnl_with_networth()
RETURNS TABLE (
  user_id uuid,
  username text,
  avatar_url text,
  pnl numeric,
  net_worth numeric,
  trade_count bigint
) AS $$
BEGIN
  RETURN QUERY
    SELECT
      p.id AS user_id,
      p.username,
      p.avatar_url,
      COALESCE(SUM((CASE 
                        WHEN t.status = 'sold' THEN t.sale_volume * CAST(t.sold_price AS numeric)
                        ELSE CAST(m.price AS numeric) * t.purchase_volume
                    END) - (CAST(t.bought_price AS numeric) * t.purchase_volume)), 0) AS pnl,
      CAST(p.balance AS numeric) + COALESCE(SUM((CASE 
                                                    WHEN t.status = 'sold' THEN t.sale_volume * CAST(t.sold_price AS numeric)
                                                    ELSE CAST(m.price AS numeric) * t.purchase_volume
                                                END)), 0) AS net_worth,
      COUNT(t."trade id") AS trade_count
    FROM profiles p
    LEFT JOIN trades t ON t.user_id = p.id AND (t.status = 'bought' OR t.status = 'sold')
    LEFT JOIN market m ON m.id = t.stock_id
    GROUP BY p.id
    HAVING COUNT(t."trade id") > 0
END; $$ LANGUAGE plpgsql;


*/
