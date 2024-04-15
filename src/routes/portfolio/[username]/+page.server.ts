import type { InventoryItem } from '$lib/types';
import { error } from '@sveltejs/kit';

export const load = async ({ params, locals: { supabase } }) => {
	const { username } = params;

	const { data: userData, error: userError } = await supabase
		.from('profiles')
		.select('balance, id, avatar_url')
		.ilike('username', username)
		.single();

	if (userError) {
		throw error(503, userError);
	}

	const { data: inventoryData, error: inventoryError } = await supabase
		.from('inventory')
		.select('*, market(id, name, price, ticker)')
		.gte('quantity', 1)
		.eq('user_id', userData.id);

	if (inventoryError) {
		throw error(503, 'Error fetching user inventory');
	}

	const { data: tradeHistoryData, error: tradeError } = await supabase
		.from('trades')
		.select(
			'trade_id, date_purchased, bought_price, purchase_volume, sold_price, sale_volume, status, market(ticker)'
		)
		.eq('user_id', userData.id)
		.order('date_purchased', { ascending: false });

	if (tradeError) {
		throw error(503, 'Error fetching user trade history: ' + tradeError);
	}

	const tradeHistory = tradeHistoryData.map((trade) => ({
		trade_id: trade.trade_id,
		ticker: trade.market.ticker,
		date_purchased: trade.date_purchased,
		bought_price: trade.bought_price,
		purchase_volume: trade.purchase_volume,
		sold_price: trade.sold_price,
		sale_volume: trade.sale_volume,
		status: trade.status
	}));

	const { data: marketData, error: initialError } = await supabase
		.from('market')
		.select('id, name, ticker, price, market_cap')
		.in(
			'id',
			inventoryData.map((item) => item.market.id)
		);

	if (initialError) {
		throw error(503, initialError);
	}

	const userBalance = userData?.balance ?? null;
	const userInventory = inventoryData as InventoryItem[];
	const netWorth = calcNW(userInventory, userBalance);
	const avatarUrl = userData?.avatar_url || null;

	// console.log(tradeHistory);

	return {
		tradeHistory,
		marketData,
		userBalance,
		userInventory,
		netWorth,
		avatarUrl
	};
};

function calcNW(x: InventoryItem[], snapshotBalance: number): number {
	let total = snapshotBalance || 0;

	x.forEach((element) => {
		total += element.quantity * element.market.price;
	});

	return total;
}
