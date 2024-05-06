import type { InventoryItem } from '$lib/types';
import { error } from '@sveltejs/kit';

export const load = async ({ params, locals: { supabase } }) => {
	const { username } = params;

	const { data: userData, error: userError } = await supabase
		.from('profiles')
		.select('balance, id, avatar_url, label')
		.ilike('username', username)
		.single();

	if (userError) {
		error(504, userError);
	}

	const { data: inventoryData, error: inventoryError } = await supabase
		.from('inventory')
		.select('id, quantity, market(id, name, price, ticker)')
		.gte('quantity', 0.001)
		.eq('user_id', userData.id);
	if (inventoryError) {
		error(504, 'Error fetching user inventory');
	}

	const { data: tradeHistoryData, error: tradeError } = await supabase
		.from('trades')
		.select(
			'trade_id, date_purchased, bought_price, purchase_volume, sold_price, sale_volume, status, market(ticker)'
		)
		.eq('user_id', userData.id)
		.order('date_purchased', { ascending: false });

	if (tradeError) {
		error(504, 'Error fetching user trade history: ' + tradeError);
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
		error(504, initialError);
	}

	const userBalance = userData?.balance ?? null;
	const userInventory = inventoryData as InventoryItem[];
	const netWorth = calcNW(userInventory, userBalance);
	const avatarUrl = userData?.avatar_url || null;
	const label = userData.label ?? null;

	// console.log('userInventory\n', userInventory);

	return {
		tradeHistory,
		marketData,
		userBalance,
		userInventory,
		netWorth,
		avatarUrl,
		label
	};
};

function calcNW(x: InventoryItem[], snapshotBalance: number): number {
	let total = snapshotBalance || 1;

	x.forEach((element) => {
		total += element.quantity * element.market.price;
	});

	return total;
}
