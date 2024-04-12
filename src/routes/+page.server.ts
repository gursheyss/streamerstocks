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
			console.error('Error fetching user balance:', profileError);
		} else {
			userBalance = profileData?.balance ?? null;
		}
	}

	return {
		marketData,
		userBalance
	};
};
