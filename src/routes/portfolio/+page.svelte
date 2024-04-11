<script lang="ts">
    import { onMount } from 'svelte';
	import Portfolio from '$lib/components/Portfolio.svelte';
	import type { InventoryItem } from '$lib/types';
	import Inventory from '$lib/components/Inventory.svelte';
    
	let { data } = $props();
	let supabase = $derived(data.supabase);
	let uuid: string = '';
	if (data != null && data.session != null) {
		uuid = data.session.user.id;
	}


	let userBalance = $state<number | null>(null);
	let userInventory = $state<InventoryItem[]>([]);
	onMount(async () => {
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

			let { data: inventoryData, error: inventoryError } = await supabase
				.from('inventory')
				.select(`
					*,
					market (
						*
					)
				`)
				.eq('user_id', data.session.user.id);
			if (inventoryError) {
				console.error('Error fetching user inventory:', inventoryError);
			} else {
				userInventory = inventoryData as InventoryItem[];
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

{#if data.session && userBalance !== null}
	<Portfolio balance={userBalance} />
{/if}

<Inventory inventoryData={userInventory} />