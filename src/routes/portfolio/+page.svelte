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
	let netWorth = $state(0);
	let userInventory = $state<InventoryItem[]>([]);
	function calcNW(x: InventoryItem[], snapshotBalance: number): number {
		let total = 0;
		if (snapshotBalance != 0) {
			total = snapshotBalance;
		}
		x.forEach((element) => {
			total += element.quantity * element.market.price;
		});
		return total;
	}

	onMount(async () => {
		// Fetch user balance only if data.session exists
		const { data: initialData, error } = await supabase
			.from('market')
			.select('id,name,ticker,price,low,high,market_cap,volume,image');

		if (error) {
			console.error('Error fetching initial data:', error);
		} else {
			marketData = {
				...initialData[0],
				history: []
			};
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
				.select(
					`
					*,
					market (
						*
					)
				`
				)
				.gte('quantity', 1)
				.eq('user_id', data.session.user.id);
			if (inventoryError) {
				console.error('Error fetching user inventory:', inventoryError);
			} else {
				userInventory = inventoryData as InventoryItem[];
			}
			if (profileData != null) {
				netWorth = calcNW(userInventory, profileData?.balance);
			}
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

{#if data.session && userBalance !== null && userInventory != null}
	<Portfolio balance={userBalance} {netWorth} />
{/if}

<Inventory inventoryData={userInventory} />
