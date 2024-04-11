<script lang="ts">
	import { page } from '$app/stores';
	import Chart from '$lib/components/Chart.svelte';
	import type { MarketItem } from '$lib/types.js';
	import { onMount } from 'svelte';

	let { data } = $props();
	let { ticker } = $derived($page.params);
	let { supabase } = $derived(data);
	let marketData: MarketItem[] = $state([]);
	let activeTab = 'comments';

	onMount(async () => {
		let { data: initialData, error } = await supabase
			.from('market')
			.select('*')
			.ilike('ticker', ticker);

		if (error) {
			console.error('Error fetching initial data:', error);
		} else {
			marketData = initialData as MarketItem[];
		}
	});

	$effect(() => {
		const marketSubscription = supabase
			.channel('market')
			.on(
				'postgres_changes',
				{
					event: '*',
					schema: 'public',
					table: 'market'
				},
				(payload: any) => {
					const { new: newData, old: oldData } = payload;

					if (newData.ticker !== ticker && oldData.ticker !== ticker) {
						return;
					}

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
				}
			)
			.subscribe();

		return () => {
			marketSubscription.unsubscribe();
		};
	});
</script>

{#if marketData[0] && marketData[0].history}
	<div class="bg-gray2 text-white min-h-screen font-inter">
		<div class="container mx-auto px-4 pt-8">
			<h1 class="text-4xl font-bold">
				{marketData[0].name}
				<span class="text-gray-500">${ticker.toUpperCase()}</span>
			</h1>

			<div class="bg-gray rounded-lg shadow-lg p-6 mb-8 w-full">
				<Chart stockData={marketData[0].history} />
			</div>
		</div>
	</div>
{/if}
