<script lang="ts">
    import { onMount } from 'svelte';
	import Portfolio from '$lib/components/Portfolio.svelte';
	import type { InventoryItem } from '$lib/types';
	import Inventory from '$lib/components/Inventory.svelte';
	import type { MarketItem } from '$lib/types.js';
    
	let { data } = $props();
	let supabase = $derived(data.supabase);
	let uuid: string = '';
	if (data != null && data.session != null) {
		uuid = data.session.user.id;
	}
	let marketData: MarketItem[] = [];

	let userBalance = $state<number | null>(null);
	let userInventory = $state<InventoryItem[]>([]);
	let netWorth = $state<number | null>(null);
	async function calculatePortfolioValue(supabase, userId, marketData) {
		const { data: trades, error } = await supabase.from('trades').select('*').eq('user_id', userId);

		if (error) {
			console.error('Error fetching trades:', error);
			return 0;
		}

		return trades.reduce((acc, trade) => {
			const marketItem = marketData.find((item) => item.id === trade.stock_id);
			return acc + (marketItem?.price ?? 0) * trade.purchase_volume;
		}, 0);
	}
	onMount(async () => {
		// Fetch user balance only if data.session exists
			const { data: initialData, error } = await supabase
			.from('market')
			.select('*')
			.order('price', { ascending: false });
		if (error) {
			console.error('Error fetching initial data:', error);
		} else {
			marketData = initialData as MarketItem[];
		}
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

			let { data: inventoryData, error: inventoryError } = await supabase
				.from('inventory')
				.select(`
					*,
					market (
						*
					)
				`)
				.gte('quantity', 1)
				.eq('user_id', data.session.user.id);
			if (inventoryError) {
				console.error('Error fetching user inventory:', inventoryError);
			} else {
				userInventory = inventoryData as InventoryItem[];
			}
			const { data: initialData, error } = await supabase
				.from('market')
				.select('*')
				.order('price', { ascending: false });
			if (error) {
				console.error('Error fetching initial data:', error);
			} else {
				marketData = initialData as MarketItem[];
			}
			netWorth =
				(await calculatePortfolioValue(supabase, data.session.user.id, marketData)) + userBalance;
		}
		
	});

	$effect(() => {
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
			profileSubscription?.unsubscribe();
		};
	});
</script>

{#if data.session && userBalance !== null && netWorth != null}
	<Portfolio balance={userBalance} {netWorth}/>
{/if}

<Inventory inventoryData={userInventory} />