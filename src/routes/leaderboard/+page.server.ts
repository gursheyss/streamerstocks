import type { MarketItem } from '$lib/types.js';

export const load = async ({ locals }) => {
	const { data } = await locals.supabase
		.from('profiles')
		.select('*')
		.order('balance', { ascending: false });

	return { marketData: data as MarketItem[] };
};
