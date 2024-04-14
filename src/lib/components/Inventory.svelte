<script lang="ts">
	import type { InventoryItem } from '$lib/types';

	let { inventoryData }: { inventoryData: InventoryItem[] } = $props();
</script>

<div class="bg-gray2 rounded-lg shadow-lg p-4 font-inter">
	<h2 class="text-xl font-bold text-white mb-4">Your Inventory</h2>

	<table class="w-full border-b border-gray-700">
		<tbody>
			{#each inventoryData as item}
				<tr class="text-white font-bold items-center">
					<td class="py-4 items-center">
						<span>{item.market.name}</span>
						<span class="text-gray-400 ml-2">${item.market.ticker}</span>
					</td>
					<td class="py-4 text-right"
						>{item.quantity} <span class="text-gray-400 ml-1">Shares</span></td
					>
					<td class="py-4 text-right"
						>${(item.market.price * item.quantity).toFixed(2).toLocaleString()}</td
					>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
