import type { MarketItem } from '$lib/types';

export const actions = {
	signOut: async ({ locals: { supabase } }) => {
		await supabase.auth.signOut();
	}
};

export const load = async ({ locals: { supabase, getSession } }) => {
	const session = await getSession();
	let marketData: MarketItem[] = [];
	let userBalance: number | null = null;
	let netWorth: number | null = null;

	const { data: initialData, error } = await supabase
		.from('market')
		.select('*')
		.order('price', { ascending: false });
	if (error) {
		console.error('Error fetching initial data:', error);
	} else {
		marketData = initialData as MarketItem[];
	}

	if (session) {
		const { data: profileData, error: profileError } = await supabase
			.from('profiles')
			.select('balance')
			.eq('id', session.user.id)
			.single();

		if (profileError) {
			console.error('Error fetching user profile:', profileError);
		} else {
			userBalance = profileData?.balance ?? null;
			// Calculate net worth here
			netWorth =
				(await calculatePortfolioValue(supabase, session.user.id, marketData)) + userBalance;
		}
	}

	return {
		marketData,
		userBalance,
		netWorth
	};
};

// Helper function to calculate the portfolio value
async function calculatePortfolioValue(supabase, userId, marketData) {
	const { data: trades, error } = await supabase.from('trades').select('*').eq('user_id', userId);

	if (error) {
		console.error('Error fetching trades:', error);
		return 0;
	}

	return trades.reduce((acc, trade) => {
		const marketItem = marketData.find((item) => item.id === trade.stock_id);
		return acc + (marketItem?.price ?? 0) * trade.purchase_volume;
	}, 0);
}
