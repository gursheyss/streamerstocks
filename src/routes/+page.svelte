<script lang="ts">
	import Table from '$lib/components/Table.svelte';
	import type { MarketItem } from '$lib/types.js';
	import type { InventoryItem } from '$lib/types';
	import Portfolio from '$lib/components/Portfolio.svelte';

	let { data } = $props();
	let supabase = $derived(data.supabase);

	let marketData = $state<MarketItem[]>(data.marketData);
	let userBalance = $state<number | null>(data.userBalance);
	let inventoryData = $state<InventoryItem[] | null>(data.userInventory);
	let snapshotBalance = 0;
	if (userBalance != null) {
		snapshotBalance = userBalance;
	}
	function calcNW(x: InventoryItem[]): number {
		let total = 0;
		if (snapshotBalance != 0) {
			total = snapshotBalance;
		}
		x.forEach((element) => {
			total += element.quantity * element.market.price;
		});
		return total;
	}
	$effect(() => {
		document.title = 'BopStocks';
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

		// const networthSubscription = data.session
		// 	? supabase
		// 			.channel('networth')
		// 			.on(
		// 			'postgres_changes',
		// 			{
		// 				event: '*',
		// 				schema: 'public',
		// 				table: 'inventory',
		// 				filter: `user_id=eq.${data.session.user.id}`
		// 			},
		// 			(payload: any) => {
		// 				const{new: newData} = payload;
		// 				inventoryData = newData;

		// 			})
		// 			.subscribe()
		// 	: null;

		return () => {
			marketSubscription.unsubscribe();
			profileSubscription?.unsubscribe();
			// networthSubscription?.unsubscribe();
		};
	});
</script>

<div class="bg-green-600 text-white text-center py-2 mb-4">
	<!-- New div -->
	The market is now open, click on a stock to buy/sell
</div>

{#if data.session && userBalance !== null && inventoryData != null}
	<Portfolio balance={userBalance} netWorth={calcNW(inventoryData)} />
{/if}

<Table {marketData} />
