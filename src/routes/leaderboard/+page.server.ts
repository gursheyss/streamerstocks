import type { Profile, Trade } from '$lib/types.ts';

// Helper function to calculate total valuation
async function calculateTotalValuation(trades: Trade[], currentPrices: Record<number, number>) {
	const total = trades.reduce((acc, trade) => {
		const currentPrice = currentPrices[trade.stock_id];
		if (trade.status === 'bought' && currentPrice) {
			return acc + (currentPrice - trade.bought_price) * trade.purchase_volume;
		}
		return acc;
	}, 0);

	return total;
}

async function getCurrentMarketPrices(supabase: {
	from: (arg0: string) => {
		(): any;
		new (): any;
		select: {
			(arg0: string): PromiseLike<{ data: any; error: any }> | { data: any; error: any };
			new (): any;
		};
	};
}) {
	const { data, error } = await supabase.from('market').select('id, price');

	if (error) {
		console.error('Error fetching market prices:', error);
		return {};
	}
	const marketPrices = data.reduce(
		(prices: { [x: string]: any }, stock: { id: string | number; price: any }) => {
			prices[stock.id] = stock.price;
			return prices;
		},
		{}
	);

	return marketPrices;
}

export const load = async ({ locals }) => {
	const currentMarketPrices = await getCurrentMarketPrices(locals.supabase);
	const { data: profiles } = await locals.supabase.from<Profile>('profiles').select('*');
	const { data: trades } = await locals.supabase.from<Trade>('trades').select('*');

	// Add total valuation to each profile
	const profilesWithValuation = await Promise.all(
		profiles.map(async (profile: { id: any }) => {
			const userTrades = trades
				? trades.filter((trade: { user_id: any }) => trade.user_id === profile.id)
				: [];
			// Await the calculation of total valuation here
			const totalValuation = await calculateTotalValuation(userTrades, currentMarketPrices);
			return { ...profile, totalValuation };
		})
	);

	return { marketData: profilesWithValuation };
};
