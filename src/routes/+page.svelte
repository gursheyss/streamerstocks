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
		let { data, error } = await supabase.from('market').select().eq('id', stockID);
		if (error) console.error('Error getting stockID' + error);
		console.log(data);

		if (data != null) {
			let price = data[0]['price'];
			if (bal >= price * amt || amt > 0) {
				console.log({
					amt: (price * amt).toFixed(2),
					userid: uuid
				});
				let { data: userData, error: userError } = await supabase.rpc('update_user_bal', {
					amt: (price * amt).toFixed(2),
					userid: uuid
				});
				if (userError) console.error(userError);
				else console.log('user updating' + userData);

				//needs to add/remove stock from porfolio

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
		let { data: initialData, error } = await supabase
			.from('market')
			.select('*')
			.order('price', { ascending: false });
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
<button id="BuyButton" on:click={() => updateStockAndBal(userBalance!, -3, placeHolderID)}
	>Buy</button
>
<button id="SellButton" on:click={() => updateStockAndBal(userBalance!, 3, placeHolderID)}
	>Sell</button
>
