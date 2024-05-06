import type { MarketItem } from '$lib/types';
import type { InventoryItem } from '$lib/types';
import { supabase } from '$lib/server/supabase';
import { redis } from '$lib/server/redis';
import { redirect } from '@sveltejs/kit';

export const actions = {
	signOut: async ({ locals: { supabase } }) => {
		await supabase.auth.signOut();
		redirect(302, '/?signedOut=true');
	}
};

export const load = async ({ locals: { safeGetSession } }) => {
	const session = await safeGetSession();
	let userBalance: number | null = null;
	let userInventory: InventoryItem[] | null = null;
	let marketData: MarketItem[] = [];

	const cachedMarketData = await redis.get('marketData');
	// add more conditions for validation
	if (cachedMarketData) {
		marketData = cachedMarketData;
	} else {
		const { data: initialData, error: initError } = await supabase.from('market').select('*');
		if (initError || initialData === undefined) {
			console.error(initError);
		} else {
			const initMarketData: MarketItem[] = [];
			for (let i = 0; i < initialData.length; i += 1) {
				const cachedIndivMarketData = await redis.get<MarketItem>('marketData' + initialData[i].id);
				//todo:: add more validatino for conditions
				if (cachedIndivMarketData != null && cachedIndivMarketData.history.length == 0) {
					const marketItem = cachedIndivMarketData;
					initMarketData.push({
						...marketItem,
						history: marketItem.history
					});
				} else {
					let { data: lastHourMarketHistory, error: marketError } = await supabase.rpc(
						'get_stock_history_over_range',
						{ stockid: initialData[i].id, hour_range: 24, min_interval: 60 }
					);
					if (marketError) {
						console.error('error fetching marketData', marketError);
					} else {
						if (lastHourMarketHistory != null && initialData != null) {
							initMarketData.push({
								...initialData[i],
								history: lastHourMarketHistory,
								low: 0,
								high: 0,
								volume: 0
							} as MarketItem);
						}
						marketData = initMarketData;
						// console.log(marketData);
					}
				}
			}
			await redis.set('marketData', JSON.stringify(marketData), {
				ex: 60
			});
		}
	}
	// redo in db function
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
		const { data: inventoryData, error: inventoryError } = await supabase
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
