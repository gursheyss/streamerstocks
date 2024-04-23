<script lang="ts">
	import Portfolio from '$lib/components/Portfolio.svelte';
	import Inventory from '$lib/components/Inventory.svelte';
	import { page } from '$app/stores';
	import TradeHistory from '$lib/components/TradeHistory.svelte';
	import clsx from 'clsx';

	let { data } = $props();
</script>

{#if data.userBalance !== null && data.userInventory != null}
	<div class="flex items-center p-4">
		<img src={data.avatarUrl} alt="User avatar" class="rounded-full w-16 h-16 mr-4" />
		<div class="mr-4 text-lg font-bold">
			<span
				class={clsx({
					'text-yellow-400': data.label === 'dev',
					'text-purple-400': data.label === 'streamer'
				})}
			>
				{#if data.label}
					[{data.label}]
				{/if}
			</span>
			<span>{$page.params.username}</span>
		</div>
		<Portfolio balance={data.userBalance} netWorth={data.netWorth} />
	</div>
{/if}

<div class="flex flex-col space-y-4">
	<Inventory inventoryData={data.userInventory} />
	<TradeHistory tradeHistory={data.tradeHistory} />
</div>
