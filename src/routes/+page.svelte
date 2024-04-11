<script lang="ts">
	import { onMount } from 'svelte';
	import Table from '$lib/components/Table.svelte';
	import type { MarketItem } from '$lib/types.js';
	import Portfolio from '$lib/components/Portfolio.svelte';
	import Chart from '$lib/components/Chart.svelte';
	import { enhance } from '$app/forms';

	let { data } = $props();
	let supabase = $derived(data.supabase);
	let uuid: string = '';
	if (data != null && data.session != null) {
		uuid = data.session.user.id;
	}
	let placeHolderID: number = 28;

	async function updateStockAndBal(bal: number, amt: number, stockID: number) {
		//ERRORS NEED TO BE HANDLED FOR PROD, ALSO THIS CODE IS ASSUMING WE ARE LOGGED IN
		//get stock data
		let { data: initStockData, error: initStockError } = await supabase.from('market').select().eq('id', stockID);
		if (initStockError) console.error("Error getting data from stockID" + initStockError);
		//create entry if none (init at 0)
		let { data: createEntryData, error: createEntryError } = await supabase
		.rpc('create_inventory_entry', {
			stockid: stockID, 
			userid: uuid
		})
		if (createEntryError) console.error(createEntryError)
		else console.log(createEntryData)
		//get user inventory for specific stock
		let { data: inventoryData, error: inventoryError } = await supabase
		.rpc('get_user_inventory', {
			userid: uuid
		})
		.eq('stock_id', stockID)
		if (inventoryError) console.error(inventoryError)
		else console.log(inventoryData[0]['quantity'])

		if (initStockData != null) {
			let price = initStockData[0]['price'];
			let currentQuantity = inventoryData[0]['quantity'];
			//first condition is buy, second sell. - for buy, + for sell
			if ((bal + price * amt >= 0 && amt < 0) || (amt > 0 && currentQuantity >= amt)) {
				console.log("work")
				console.log({
					amt: (price * amt),
					userid: uuid
				});
				let { data: userData, error: userError } = await supabase.rpc('update_user_bal', {
					amt: (price * amt),
					userid: uuid
				});
				if (userError) console.error(userError);
				else console.log('user updating' + userData);
			
				//needs to add/remove stock from porfolio, negative because we do - when buy
				let { data: inventoryData, error: inventoryError } = await supabase
				.rpc('update_inventory', {
					amt: -amt, 
					stockid: stockID, 
					userid: uuid
				})
				if (inventoryError) console.error(inventoryError)
				else console.log(inventoryData)
				let { data: stockData, error: stockError } = await supabase.rpc('update_stock', {
					amt: amt,
					stockid: stockID
				});
				if (stockError) console.error(stockError);
				else console.log('stock updating:' + stockData);
			}
		}
	}

	interface MarketItem {
		id: string;
		name: string;
		ticker: string;
		price: number;
		low: number;
		high: number;
		market_cap: number;
		volume: number;
		image: string;
	}

	let marketData = $state<MarketItem[]>([]);
	let userBalance = $state<number | null>(null);
	onMount(async () => {
		let { data: initialData, error } = await supabase.from('market').select('*');
		if (error) {
			console.error('Error fetching initial data:', error);
		} else {
			marketData = initialData as MarketItem[];
		}

		// Fetch user balance only if data.session exists
		if (data.session) {
			let { data: profileData, error: profileError } = await supabase
				.from('profiles')
				.select('balance')
				.eq('id', data.session.user.id)
				.single();

			if (profileError) {
				console.error('Error fetching user balance:', profileError);
			} else {
				userBalance = profileData?.balance ?? null;
			}
		}
	});

	$effect(() => {
		const marketSubscription = supabase
			.channel('market')
			.on('postgres_changes', { event: '*', schema: 'public', table: 'market' }, (payload: any) => {
				const { new: newData, old: oldData } = payload;
				if (payload.eventType === 'INSERT') {
					// New record inserted
					marketData = [...marketData, newData as MarketItem];
				} else if (payload.eventType === 'UPDATE') {
					// Record updated
					marketData = marketData.map((item) =>
						item.id === newData.id ? (newData as MarketItem) : item
					);
				} else if (payload.eventType === 'DELETE') {
					// Record deleted
					marketData = marketData.filter((item) => item.id !== oldData.id);
				}
			})
			.subscribe();

		const profileSubscription = data.session
			? supabase
					.channel('profiles')
					.on(
						'postgres_changes',
						{
							event: 'UPDATE',
							schema: 'public',
							table: 'profiles',
							filter: `id=eq.${data.session.user.id}`
						},
						(payload: any) => {
							const { new: newData } = payload;
							userBalance = newData.balance;
						}
					)
					.subscribe()
			: null;

		return () => {
			marketSubscription.unsubscribe();
			profileSubscription?.unsubscribe();
		};
	});
</script>

{#if data.session && userBalance !== null}
	<Portfolio balance={userBalance} />
{/if}

<Table {marketData} />

<!-- PLACEHOLDER VALUES FOR NOW -->
<button id="BuyButton" on:click={() => updateStockAndBal(userBalance!, -1, placeHolderID)}>Buy</button>
<button id="SellButton" on:click={() => updateStockAndBal(userBalance!, 1, placeHolderID)}>Sell</button>
