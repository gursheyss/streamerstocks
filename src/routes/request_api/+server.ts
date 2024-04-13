import { createClient } from '@supabase/supabase-js'
import { SUPABASE_SERVICE_KEY } from '$env/static/private';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
const supabase = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_KEY)
// /api/ POST

export async function POST({ request }) {
    console.log("REQUEST" + request)
    let {uuid, amt, stockID} = await request.json()
    console.log(uuid + " " + amt + " " + stockID)
    let found = false;
    let { data: bal, error: balError } = await supabase
    .rpc('get_user_bal', {
        userid: uuid
    })
    if (balError) console.error(balError)
    else console.log(bal)
    //get stock data
    let { data: initStockData, error: initStockError } = await supabase
        .from('market')
        .select()
        .eq('id', stockID);
    if (initStockError) console.error('Error getting data from stockID' + initStockError);
    //create entry if none (init at 0)
    let { data: createEntryData, error: createEntryError } = await supabase.rpc(
        'create_inventory_entry',
        {
            stockid: stockID,
            userid: uuid
        }
    );
    if (createEntryError) console.error(createEntryError);
    else console.log(createEntryData);
    //get user inventory for specific stock
    let { data: inventoryData, error: inventoryError } = await supabase
        .rpc('get_user_inventory', {
            userid: uuid
        })
        .eq('stock_id', stockID);
    if (inventoryError) console.error(inventoryError);
    else console.log(inventoryData[0]['quantity']);

    if (initStockData != null) {
        let price = initStockData[0]['price'];
        let currentQuantity = inventoryData[0]['quantity'];
        //first condition is buy, second sell. - for buy, + for sell
        if ((bal + price * amt >= 0 && amt < 0) || (amt > 0 && currentQuantity >= amt)) {
            console.log('work');
            console.log({
                amt: price * amt,
                userid: uuid
            });
            let { data: userData, error: userError } = await supabase.rpc('update_user_bal', {
                amt: price * amt,
                userid: uuid
            });
            if (userError) console.error(userError);
            else console.log('user updating' + userData);

            //needs to add/remove stock from porfolio, negative because we do - when buy
            let { data: inventoryData, error: inventoryError } = await supabase.rpc(
                'update_inventory',
                {
                    amt: -amt,
                    stockid: stockID,
                    userid: uuid
                }
            );
            if (inventoryError) console.error(inventoryError);
            else console.log(inventoryData);
            let { data: stockData, error: stockError } = await supabase.rpc('update_stock', {
                amt: -amt,
                stockid: stockID
            });
            if (stockError) console.error(stockError);
            else console.log('stock updating:' + stockData);
            found = true;
        }
    }
    // return success
    return new Response(JSON.stringify({ success: found}), {
        headers: {
        'Content-Type': 'application/json'
        }
    })
}