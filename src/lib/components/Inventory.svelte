<script lang="ts">
	import type { InventoryItem } from '$lib/types';

	let { inventoryData }: { inventoryData: InventoryItem[] } = $props();

	function handleRowClick(ticker: string) {
		window.location.href = `/stock/${ticker}`;
	}
</script>

<div class="bg-gray2 rounded-lg shadow-lg font-inter p-4">
	<h2 class="text-xl font-bold text-white mb-4">Inventory</h2>
	<table class="w-full border-gray-700">
		<tbody>
			{#each inventoryData as item}
				<tr
					class="text-white font-bold items-center hover:bg-lightgray cursor-pointer"
					on:click={() => handleRowClick(item.market.ticker)}
				>
					<td class="items-center py-4">
						<span>{item.market.name}</span>
						<span class="text-gray-400 ml-2">${item.market.ticker}</span>
					</td>
					<td class="text-right py-4"
						><span class="text-gray-400 ml-1">Shares</span>
						{(Math.floor(item.quantity * 1000) / 1000).toLocaleString(undefined, {
							minimumFractionDigits: 0,
							maximumFractionDigits: 3
						})}
					</td>
					{#if item.pnl >= 0}
					<td class="text-right py-4 text-green-500">
						<span class="text-gray-400 ml-1">Return</span>
						$+{item.pnl.toFixed(2).toLocaleString()}
					</td>
					{:else}
					<td class="text-right py-4 text-red-500">
						<span class="text-gray-400 ml-1">Return</span>
						${item.pnl.toFixed(2).toLocaleString()}
					</td>
					{/if}
					<td class="text-right py-4">
						<span class="text-gray-400 ml-1">Market Value</span>
						${(item.market.price * item.quantity).toFixed(2).toLocaleString()}
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
