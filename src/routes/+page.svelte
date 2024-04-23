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
			profileSubscription?.unsubscribe();
			// networthSubscription?.unsubscribe();
		};
	});
</script>

<div class="bg-green-700 text-white text-center py-2 mb-4">
	<!-- New div -->
	Everyone has been reset to $10,000 + redeemed channel points and all girls have been removed.
</div>

{#if data.session && userBalance !== null && inventoryData != null}
	<Portfolio balance={userBalance} netWorth={calcNW(inventoryData)} />
{/if}

<Table {marketData} />
