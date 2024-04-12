<script lang="ts">
	import { onMount } from 'svelte';
	import Table from '$lib/components/Table.svelte';
	import type { MarketItem } from '$lib/types.js';
	import Portfolio from '$lib/components/Portfolio.svelte';

	let { data } = $props();
	let supabase = $derived(data.supabase);

	let marketData = $state<MarketItem[]>(data.marketData);
	let userBalance = $state<number | null>(data.userBalance);
	let netWorth = $state<number | null>(data.netWorth);

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

		return () => {
			marketSubscription.unsubscribe();
			profileSubscription?.unsubscribe();
		};
	});
</script>

<div class="bg-red-700 text-white justify-center flex p-4 text-inter font-bold">
	Buying and selling is disabled until the boplympics
</div>

{#if data.session && userBalance !== null}
	<Portfolio balance={userBalance} {netWorth} />
{/if}

<Table {marketData} />
