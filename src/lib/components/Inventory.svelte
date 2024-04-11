<script lang="ts">
	import type { MarketItemHistory, InventoryItem } from '$lib/types';
	import MiniChart from './MiniChart.svelte';

    let { inventoryData }: { inventoryData: InventoryItem[] } = $props();


	function calculatePercentageChange(history: MarketItemHistory[]): number {
		if (history.length > 1) {
			const firstValue = history[0].price;
			const lastValue = history[history.length - 1].price;
			return ((lastValue - firstValue) / firstValue) * 100;
		}
		return 0;
    }
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
					<td class="py-4 text-right">{item.quantity} <span class="text-gray-400 ml-1">Shares</span></td>
					<td class="py-4 text-right">${(item.market.price * item.quantity).toFixed(2).toLocaleString()}</td>
                    <td class="py-4 text-right">
						{#if calculatePercentageChange(item.market.history) > 0}
							<span class="text-green-500"
								>+{calculatePercentageChange(item.market.history).toFixed(2)}%</span
							>
						{:else if calculatePercentageChange(item.market.history) < 0}
							<span class="text-red-500">{calculatePercentageChange(item.market.history).toFixed(2)}%</span
							>
						{:else}
							<span class="text-gray-400">0%</span>
						{/if}
					</td>
					<td class="py-4 text-right flex items-center justify-center">
						<div class="w-24 h-24">
							<MiniChart stockData={item.market.history} />
						</div>
					</td>
                </tr>
            {/each}
		</tbody>
	</table>
</div>