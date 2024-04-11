<script lang="ts">
	import { onMount } from 'svelte';
	import Table from '$lib/components/Table.svelte';
	import type { MarketItem } from '$lib/types.js';
	import Portfolio from '$lib/components/Portfolio.svelte';
	import Chart from '$lib/components/Chart.svelte';

	let { data } = $props();
	let supabase = $derived(data.supabase);
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

{#if marketData.length === 0}
	<p>Loading...</p>
{:else}
	<Chart stockData={marketData[0].history} />
{/if}
{#if data.session && userBalance !== null}
	<Portfolio balance={userBalance} />
{/if}

<Table {marketData} />
