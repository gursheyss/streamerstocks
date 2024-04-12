<script lang="ts">
	import type { MarketItem, MarketItemHistory } from '$lib/types';

	import MiniChart from './MiniChart.svelte';

	let { marketData }: { marketData: MarketItem[] } = $props();

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
	<table class="w-full border-b border-gray-700">
		<tbody>
			{#each marketData as item}
				<tr class="text-white font-bold">
					<td class="py-4 px-4">
						<a href={`/stock/${item.ticker}`}>
							<span class="text-xl">{item.name}</span>
							<span class="text-gray-400 ml-2 text-sm">${item.ticker}</span>
						</a>
					</td>
					<td class="py-4 text-right">${item.price.toFixed(2).toLocaleString()}</td>
					<td class="py-4 text-right">
						{#if calculatePercentageChange(item.history) > 0}
							<span class="text-green-500"
								>+{calculatePercentageChange(item.history).toFixed(2)}%</span
							>
						{:else if calculatePercentageChange(item.history) < 0}
							<span class="text-red-500">{calculatePercentageChange(item.history).toFixed(2)}%</span
							>
						{:else}
							<span class="text-gray-400">0%</span>
						{/if}
					</td>
					<td class="pb-4 text-right flex items-center justify-center">
						<div class="w-24 h-24">
							<MiniChart stockData={item.history} />
						</div>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
