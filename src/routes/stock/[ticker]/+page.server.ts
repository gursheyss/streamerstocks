import type { Comment, MarketItem } from '$lib/types';
import type { InventoryItem } from '$lib/types';
import { supabase } from '$lib/server/supabase';
import { redis } from '$lib/server/redis';

export const actions = {
	submitComment: async ({ locals: { safeGetSession }, request }) => {
		// get form data
		const session = await safeGetSession();
		if (!session) {
			return { status: 401, body: { message: 'Unauthorized' } };
		}
		const data = await request.formData();
		const comment = data.get('comment');
		const stockId = data.get('currentId');

		// console.log(comment, stockId);
		const userId = session?.user.id;

		await supabase.from('comments').insert([
			{
				comment: comment,
				stock_id: stockId,
				user_id: userId
			}
		]);
	}
};

export const load = async ({ params, locals: { safeGetSession } }) => {
	let comments: Comment[] = [];
	const { ticker } = params;
	const { data: initialData, error: initialError } = await supabase.from('market').select('id,name,ticker,price,lowest_price,highest_price,market_cap,market_volume,image').ilike('ticker', ticker);
	if (initialError) {
		console.error("initial data error", initialError);
	}
	let marketData: MarketItem | null = null;
	let {data: marketHistory, error: marketError} = await supabase.from('market_prices').select('timestamp,price').eq('stock_id', initialData[0].id).order('timestamp', { ascending: false })
	let marketPrice: number | null = null;
	if (marketError != null) {
		console.error("error fetching marketdata", marketError);
	}
	if (initialData != null) {
		const cachedMarketData = await redis.get('marketData'+initialData[0].id);
		if (cachedMarketData) {
			marketData = JSON.parse(cachedMarketData);
		}
		else {
			if (marketHistory != null && initialData != null) {
				marketData = {
					...initialData[0],
					history: marketHistory.reverse(),
					low: 0,
					high: 0,
					volume: 0
				} as MarketItem;
			}
			if (marketData != null) {
				await redis.set('marketData'+initialData[0].id, JSON.stringify(marketData), 'EX', 60 * 5);
			}

		}
	}
	let userInventory: InventoryItem[] | null = null;

	const { data: commentsData, error: commentsError } = await supabase
		.from('comments')
		.select(
			`
					id,
					comment,
					user_id,
					created_at,
					profiles!comments_user_id_fkey (
							avatar_url,
							username
					)
				`
		)
		.eq('stock_id', marketData.id)
		.order('id', { ascending: false });

	if (commentsError) {
		console.error('Error fetching comments:', commentsError);
	} else {
		const newComments = commentsData.map((comment) => ({
			id: comment.id,
			avatar_url: comment.profiles?.avatar_url || null,
			username: comment.profiles?.username || null,
			comment: comment.comment,
			created_at: comment.created_at
		}));

		// Update existing comments
		comments = comments.map((c) => newComments.find((nc) => nc.id === c.id) || c);

		// Add new comments
		const newCommentsToAdd = newComments.filter((nc) => !comments.find((c) => c.id === nc.id));
		comments = [...comments, ...newCommentsToAdd];
	}

	const session = await safeGetSession();
	let userBalance: number | null = null;

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
	}
	if (session.user) {
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
		const { data: stockPriceData, error: stockPriceError } = await supabase
			.from('market')
			.select('price')
			.eq('id', marketData.id);
		if (stockPriceError) {
			console.error('Error fetching stock price:', stockPriceError);
		} else {
			marketPrice = stockPriceData[0].price;
		}

	}

	return {
		marketData,
		comments,
		userBalance,
		userInventory,
		marketPrice
	};
};
