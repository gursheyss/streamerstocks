<script lang="ts">
	import type { InventoryItem } from '$lib/types';

	let { inventoryData }: { inventoryData: InventoryItem[] } = $props();

	function handleRowClick(ticker: string) {
		window.location.href = `/stock/${ticker}`;
	}
</script>

<div class="bg-gray2 shadow overflow-hidden sm:rounded-lg p-6 overflow-x-auto">
	<h2 class="text-lg leading-6 font-medium text-white mb-4">Inventory</h2>
	<table class="min-w-full divide-y divide-gray-700">
		<tbody class="bg-gray2 divide-y divide-gray-700">
			{#each inventoryData as item}
				<tr
					class="text-white font-bold items-center hover:bg-lightgray cursor-pointer"
					on:click={() => handleRowClick(item.market.ticker)}
				>
					<td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
						<span>{item.market.name}</span>
						<span class="text-gray-400 ml-2">${item.market.ticker}</span>
					</td>
					<td class="px-6 py-4 whitespace-nowrap text-sm text-right">
						{(Math.floor(item.quantity * 1000) / 1000).toLocaleString(undefined, {
							minimumFractionDigits: 0,
							maximumFractionDigits: 3
						})} <span class="text-gray-400 ml-1">Shares</span>
					</td>
					<td class="px-6 py-4 whitespace-nowrap text-sm text-right">
						${(item.market.price * item.quantity).toFixed(2).toLocaleString()}
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
