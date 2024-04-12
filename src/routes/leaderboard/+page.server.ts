export const load = async ({ locals }) => {
	const { data, error } = await locals.supabase.rpc('calculate_pnl_with_networth');
	if (error) {
		console.error('Error fetching PnL:', error);
		return { leaderboard: [] };
	}

	return { marketData: data };
};
