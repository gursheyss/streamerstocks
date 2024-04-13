import { redis } from '$lib/server/redis';
import type { MarketItem } from '$lib/types';
import type { InventoryItem } from '$lib/types';
export const actions = {
	signOut: async ({ locals: { supabase } }) => {
		await supabase.auth.signOut();
	}
};

export const load = async ({ locals: { supabase, safeGetSession } }) => {
	const session = await safeGetSession();
	let marketData: MarketItem[] = [];
	let userBalance: number | null = null;
	let userInventory: InventoryItem[] | null = null;

	const cachedMarketData = await redis.get('marketData');
	if (cachedMarketData) {
		console.log('Using cached market data');
		marketData = JSON.parse(cachedMarketData);
	} else {
		const { data: initialData, error } = await supabase
			.from('market')
			.select('*')
			.order('price', { ascending: false });
		if (error) {
			console.error('Error fetching initial data:', error);
		} else {
			marketData = initialData as MarketItem[];
			await redis.set('marketData', JSON.stringify(marketData), 'EX', 300);
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
