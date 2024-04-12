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

<div class="rounded-lg shadow-lg font-inter">
	<div class="w-full flex flex-col space-y-2">
		{#each marketData as item}
			<a
				href={`/stock/${item.ticker}`}
				data-sveltekit-preload-data
				class="text-white font-bold flex justify-between px-8 items-center hover:bg-lightgray bg-gray2 rounded"
			>
				<div class="flex-grow">
					<div>
						<span class="text-xl">{item.name}</span>
						<span class="text-gray-400 ml-2 text-sm">${item.ticker}</span>
					</div>
				</div>
				<div class="flex-shrink-0 flex items-center space-x-4">
					<div class="text-right">
						${item.price.toFixed(2).toLocaleString()}
					</div>
					<div class="text-right">
						{#if calculatePercentageChange(item.history) > 0}
							<span class="text-green-500">
								+{calculatePercentageChange(item.history).toFixed(2)}%
							</span>
						{:else if calculatePercentageChange(item.history) < 0}
							<span class="text-red-500">
								{calculatePercentageChange(item.history).toFixed(2)}%
							</span>
						{:else}
							<span class="text-gray-400">0%</span>
						{/if}
					</div>
					<div>
						<div class="w-24 h-24 mx-auto">
							<MiniChart stockData={item.history} />
						</div>
					</div>
				</div>
			</a>
		{/each}
	</div>
</div>
