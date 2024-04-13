<script lang="ts">
	import type { MarketItem, MarketItemHistory } from '$lib/types';
	import MiniChart from './MiniChart.svelte';

	let { marketData }: { marketData: MarketItem[] } = $props();

	function calculatePercentageChange(history: MarketItemHistory[]): number {
		let currentPrice = history.slice(-1)[0]?.price || 0;
		let beginningPrice = history[0]?.price || 0;
		return ((currentPrice - beginningPrice) / beginningPrice) * 100;
	}

	let selectedDateRange = $state('12 hour');

	function getFilteredHistory(item: MarketItem, dateRange: string): MarketItemHistory[] {
		const currentTimestamp = Math.floor(Date.now() / 1000); // Convert to seconds
		let filterTimestamp = 0;

		switch (dateRange) {
			case '1 hour':
				filterTimestamp = currentTimestamp - 60 * 60; // 1 hour in seconds
				break;
			case '12 hour':
				filterTimestamp = currentTimestamp - 12 * 60 * 60; // 12 hours in seconds
				break;
			case '24 hour':
				filterTimestamp = currentTimestamp - 24 * 60 * 60; // 24 hours in seconds
				break;
			case '7 days':
				filterTimestamp = currentTimestamp - 7 * 24 * 60 * 60; // 7 days in seconds
				break;
			default:
				return item.history;
		}

		return item.history.filter((entry) => entry.timestamp >= filterTimestamp);
	}

	let filteredMarketHistory = $derived(
		marketData.map((item) => ({
			...item,
			history: getFilteredHistory(item, selectedDateRange)
		}))
	);

	$inspect(filteredMarketHistory);
</script>

<div class="rounded-lg shadow-lg font-inter">
	<div class="w-full flex flex-col space-y-2">
		<div class="flex flex-row space-x-2 items-center justify-end">
			<select class="select max-w-[150px]" bind:value={selectedDateRange}>
				<option disabled selected>Select Date Range</option>
				<option>1 hour</option>
				<option>12 hour</option>
				<option>24 hour</option>
				<option>7 days</option>
				<option>All</option>
			</select>
			<select class="select max-w-[150px]">
				<option disabled selected>Select Filter</option>
				<option>1 hour</option>
				<option>12 hour</option>
				<option>24 hour</option>
				<option>7 days</option>
				<option>All</option>
			</select>
			<select class="select max-w-[150px]">
				<option disabled selected>Select Filter Type</option>
				<option>Ascending</option>
				<option>Descending</option>
			</select>
		</div>
		{#each filteredMarketHistory as item}
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
