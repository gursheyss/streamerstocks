import { supabase } from '$lib/server/supabase';
// /api/ POST

export async function POST({ request }) {
	console.log('REQUEST' + request);
	const { uuid, amt, stockID } = await request.json();
	console.log(uuid + ' ' + amt + ' ' + stockID);
	let found = false;
	const { data: bal, error: balError } = await supabase.rpc('get_user_bal', {
		userid: uuid
	});
	if (balError) console.error(balError);
	else console.log(bal);
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
	else console.log(createEntryData);
	//get user inventory for specific stock
	const { data: inventoryData, error: inventoryError } = await supabase
		.rpc('get_user_inventory', {
			userid: uuid
		})
		.eq('stock_id', stockID);
	if (inventoryError) console.error(inventoryError);
	else console.log(inventoryData[0]['quantity']);

	if (initStockData != null) {
		const price = initStockData[0]['price'];
		const currentQuantity = inventoryData[0]['quantity'];
		//first condition is buy, second sell. - for buy, + for sell
		if ((bal + price * amt >= 0 && amt < 0) || (amt > 0 && currentQuantity >= amt)) {
			console.log('work');
			console.log({
				amt: price * amt,
				userid: uuid
			});
			const { data: userData, error: userError } = await supabase.rpc('update_user_bal', {
				amt: price * amt,
				userid: uuid,
				stock_quantity: amt
			});
			if (userError) console.error(userError);
			else console.log('user updating' + userData);

			//needs to add/remove stock from porfolio, negative because we do - when buy
			const { data: inventoryData, error: inventoryError } = await supabase.rpc(
				'update_inventory',
				{
					amt: -amt,
					stockid: stockID,
					userid: uuid
				}
			);
			if (inventoryError) console.error(inventoryError);
			else console.log(inventoryData);
			const { data: stockData, error: stockError } = await supabase.rpc('update_stock', {
				amt: -amt,
				stockid: stockID
			});
			if (stockError) console.error(stockError);
			else console.log('stock updating:' + stockData);
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
