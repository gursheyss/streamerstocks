import type { MarketItem } from '$lib/types';
import type { InventoryItem } from '$lib/types';
import { supabase } from '$lib/server/supabase';

export const actions = {
	signOut: async ({ locals: { supabase } }) => {
		await supabase.auth.signOut();
	}
};

export const load = async ({ locals: { safeGetSession } }) => {
	const session = await safeGetSession();
	
	let userBalance: number | null = null;
	let userInventory: InventoryItem[] | null = null;
	const { data: initialData } = await supabase.from('market').select('id,name,ticker,price,lowest_price,highest_price,market_cap,market_volume,image');
	let marketData: MarketItem[] = [];
	// redo in db function
	for (let i = 0; i < initialData.length; i+=1) {
		let {data: marketHistory, error: marketError} = await supabase.from('market_prices').select('timestamp,price').eq('stock_id', initialData[i].id).order('timestamp', { ascending: false })
		if (marketHistory != null && initialData != null) {
			marketData.push({
				...initialData[i],
				price: marketHistory[0].price,
				history: marketHistory.reverse(),
				low: 0,
				high: 0,
				volume: 0
			} as MarketItem);
		}
	}
	if (session.user) {
		const { data: profileData, error: profileError } = await supabase
			.from('profiles')
			.select('balance')
			.eq('id', session.user.id)
			.single();

		if (profileError) {
			console.error('Error fetching user profile:', profileError);
		} else {
			userBalance = profileData?.balance ?? null;
		}
		// This is fetching the history from market table too but once we delete that column, should be chill
		let { data: inventoryData, error: inventoryError } = await supabase
			.from('inventory')
			.select(
				`
					*,
					market (
						*
					)
				`
			)
			.gte('quantity', 1)
			.eq('user_id', session.user.id);
		if (inventoryError) {
			console.error('Error fetching user inventory:', inventoryError);
		} else {
			userInventory = inventoryData as InventoryItem[];
		}
	}

	return {
		marketData,
		userBalance,
		userInventory
	};
};
