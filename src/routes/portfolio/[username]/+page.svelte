<script lang="ts">
	import Portfolio from '$lib/components/Portfolio.svelte';
	import Inventory from '$lib/components/Inventory.svelte';
	import { page } from '$app/stores';
	import TradeHistory from '$lib/components/TradeHistory.svelte';

	let { data } = $props();
</script>

{#if data.userBalance !== null && data.userInventory != null}
	<div class="flex items-center p-4">
		<img src={data.avatarUrl} alt="User avatar" class="rounded-full w-16 h-16 mr-4" />
		<div class="mr-4 text-lg font-bold">
			{#if $page.params.username.startsWith('[dev] ')}
				<span class="text-yellow-500">[dev]</span>
				<span>{$page.params.username.split(' ')[1]}</span>
			{:else}
				<span>{$page.params.username}</span>
			{/if}
		</div>
		<Portfolio balance={data.userBalance} netWorth={data.netWorth} />
	</div>
{/if}

<div class="flex flex-col space-y-4">
	<Inventory inventoryData={data.userInventory} />
	<TradeHistory tradeHistory={data.tradeHistory} />
</div>
