<script lang="ts">
	import type { MarketItem, MarketItemHistory } from '$lib/types';
	import MiniChart from './MiniChart.svelte';

	let { marketData }: { marketData: MarketItem[] } = $props();

	function calculatePercentageChange(history: MarketItemHistory[]): number {
		let currentPrice = history.slice(-1)[0]?.price || 0;
		let beginningPrice = history[0]?.price || 0;
		return ((currentPrice - beginningPrice) / beginningPrice) * 100;
	}
</script>

<div class="rounded-lg shadow-lg font-inter">
	<div class="w-full flex flex-col space-y-2">
		{#each marketData as item}
			{@const calculatedPercentageChange = calculatePercentageChange(item.history)}
			<a
				href={`/stock/${item.ticker}`}
				data-sveltekit-preload-data
				class="text-white font-bold flex justify-between px-6 sm:px-10 items-center hover:bg-lightgray bg-gray2 rounded"
			>
				<div class="flex-grow">
					<div class="flex flex-col sm:flex-row">
						<span class="text-xl">{item.name}</span>
						<span class="text-gray-400 ml-0 sm:ml-2 text-sm sm:pt-1">${item.ticker}</span>
					</div>
				</div>
				<div class="flex-shrink-0 flex items-center space-x-4">
					<div class="text-right flex flex-col sm:flex-row space-x-4 sm:space-x-8">
						<div class="order-2 sm:order-1">
							${item.price.toFixed(2).toLocaleString()}
						</div>
						<div class="order-1 sm:order-2">
							{#if calculatedPercentageChange > 0}
								<span class="text-green-500">
									+{calculatedPercentageChange.toFixed(2)}%
								</span>
							{:else if calculatedPercentageChange < 0}
								<span class="text-red-500">
									{calculatedPercentageChange.toFixed(2)}%
								</span>
							{:else}
								<span class="text-gray-400">0%</span>
							{/if}
						</div>
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
