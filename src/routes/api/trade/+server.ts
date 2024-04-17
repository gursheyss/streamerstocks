import { supabase } from '$lib/server/supabase';
import { redis } from '$lib/server/redis';
// /api/ POST

export async function POST({ request }) {
	// console.log('REQUEST' + request);
	const { uuid, amt, stockID } = await request.json();
	// console.log(uuid + ' ' + amt + ' ' + stockID);
	let found = false;
	const { data: bal, error: balError } = await supabase.rpc('get_user_bal', {
		userid: uuid
	});
	if (balError) console.error(balError);
	// else console.log(bal);
	//get stock data
	const { data: initStockData, error: initStockError } = await supabase
		.from('market')
		.select()
		.eq('id', stockID);
	if (initStockError) console.error('Error getting data from stockID' + initStockError);
	//create entry if none (init at 0)
	const { data: createEntryData, error: createEntryError } = await supabase.rpc(
		'create_inventory_entry',
		{
			stockid: stockID,
			userid: uuid
		}
	);
	if (createEntryError) console.error(createEntryError);
	// else console.log(createEntryData);
	//get user inventory for specific stock
	const { data: inventoryData, error: inventoryError } = await supabase
		.rpc('get_user_inventory', {
			userid: uuid
		})
		.eq('stock_id', stockID);
	if (inventoryError) console.error(inventoryError);
	// else console.log(inventoryData[0]['quantity']);

	if (initStockData != null) {
		const price = initStockData[0]['price'];
		const currentQuantity = inventoryData[0]['quantity'];
		//first condition is buy, second sell. - for buy, + for sell
		// Positive amt = buy, Negative amt = sell
		if ((bal + price * amt >= 0 && amt > 0) || (amt < 0 && currentQuantity >= amt)) {
			// Buying, update user balance first then update stock
			if (amt > 0) {
				const { data: userData, error: userError } = await supabase.rpc('update_user_bal_V2', {
					userid: uuid,
					change_in_shares: amt,
					share_price: price
				});
				if (userError) console.error(userError);

				//needs to add/remove stock from porfolio, negative because we do - when buy
				const { data: inventoryData, error: inventoryError } = await supabase.rpc('update_inventory', {
					amt: amt,
					stockid: stockID,
					userid: uuid
				});
				if (inventoryError) console.error(inventoryError);
				
				const { data: priceData, error: stockError } = await supabase.rpc('update_stock_V2', {
					stockid: stockID,
					change_in_shares: amt
				});
				if (stockError) console.error(stockError);
			}
			// Selling, update stock and use the updated price to update user balance
			else {
				const { data: priceData, error: stockError } = await supabase.rpc('update_stock_V2', {
					stockid: stockID,
					change_in_shares: amt
				});
				if (stockError) console.error(stockError);

				const { data: userData, error: userError } = await supabase.rpc('update_user_bal_V2', {
					userid: uuid,
					change_in_shares: amt,
					share_price: priceData
				});
				if (userError) console.error(userError);

				//needs to add/remove stock from porfolio, negative because we do - when buy
				const { data: inventoryData, error: inventoryError } = await supabase.rpc('update_inventory', {
					amt: amt,
					stockid: stockID,
					userid: uuid
				});
				if (inventoryError) console.error(inventoryError);
			}

			// Record the trade
			const trade = {
				user_id: uuid,
				stock_id: stockID,
				bought_price: amt < 0 ? price : null,
				purchase_volume: amt < 0 ? Math.abs(amt) : null,
				sold_price: amt > 0 ? price : null,
				sale_volume: amt > 0 ? amt : null,
				date_purchased: new Date().toISOString(),
				status: amt < 0 ? 'bought' : 'sold'
			};
			const { error: tradeError } = await supabase.from('trades').insert([trade]);
			if (tradeError) {
				console.error('Error recording trade:', tradeError);
				return new Response(JSON.stringify({ success: false }), {
					headers: {
						'Content-Type': 'application/json'
					}
				});
			}
			// Update metrics in Redis
			await updateUserMetrics(uuid); // Update user metrics after transaction

			found = true;
		}
	}
	// return success
	return new Response(JSON.stringify({ success: found }), {
		headers: {
			'Content-Type': 'application/json'
		}
	});
}

// Helper function to update user net worth, PnL, and trade count in Redis
async function updateUserMetrics(userId: any) {
	try {
		// Fetch the current balance, PnL, and trade count details from your database
		const { data: userDetails, error: userDetailsError } = await supabase
			.from('profiles')
			.select('balance, amount_redeemed')
			.eq('id', userId)
			.single();

		if (userDetailsError) throw new Error('Failed to fetch user details');

		const { data: inventoryData, error: inventoryError } = await supabase
			.from('inventory')
			.select(
				`
                quantity,
                market:stock_id (price)
            `
			)
			.eq('user_id', userId);

		if (inventoryError) throw new Error('Failed to fetch inventory details');

		const queryString = [
			'*',
			'(CASE',
			"WHEN status = 'bought' THEN purchase_volume * bought_price",
			"WHEN status = 'sold' THEN sale_volume * sold_price",
			'END) as transaction_amount'
		].join(' ');

		// console.log('Executing SQL:', queryString);

		const { data: tradeData, error: tradeDataError } = await supabase
			.from('trades')
			.select(queryString)
			.eq('user_id', userId);

		if (tradeDataError) {
			console.error('SQL Error:', tradeDataError.message);
		} else {
			console.log();
			// console.log('SQL Data:', tradeData);
		}

		// Calculate net worth and PnL
		const netWorth =
			userDetails.balance +
			inventoryData.reduce((acc, item) => acc + item.quantity * item.market.price, 0);
		const pnl = netWorth - (10000 + userDetails.amount_redeemed); // Assuming 10000 is the initial balance or some baseline
		const tradeCount = tradeData.length;
		// console.log('Net Worth:', netWorth, 'PnL:', pnl, 'Trade Count:', tradeCount);

		// Update Redis hash for detailed metrics
		await redis.hmset(`${userId}`, {
			net_worth: netWorth.toFixed(2),
			pnl: pnl.toFixed(2),
			trade_count: tradeCount
		});
		// console.log(
		// 	'redis hmset' + userId + ' ' + netWorth.toFixed(2) + ' ' + pnl.toFixed(2) + ' ' + tradeCount
		// );

		// Update the leaderboard sorted set by pnl
		await redis.zadd('leaderboard', pnl.toFixed(2), userId);

		// console.log(`Metrics updated for user: ${userId}`);
	} catch (error) {
		console.error('Failed to update user metrics:', error);
	}
}