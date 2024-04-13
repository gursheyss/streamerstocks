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
	let selectedFilter = $state('Price');
	let selectedFilterType = $state('High to Low');

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
		marketData
			.map((item) => ({
				...item,
				history: getFilteredHistory(item, selectedDateRange),
				percentageChange: calculatePercentageChange(getFilteredHistory(item, selectedDateRange))
			}))
			.sort((a, b) => {
				if (selectedFilter === 'Price') {
					return selectedFilterType === 'Low to High' ? a.price - b.price : b.price - a.price;
				} else if (selectedFilter === 'Name') {
					return selectedFilterType === 'Low to High'
						? a.name.localeCompare(b.name)
						: b.name.localeCompare(a.name);
				} else if (selectedFilter === 'Percentage Change') {
					return selectedFilterType === 'Low to High'
						? a.percentageChange - b.percentageChange
						: b.percentageChange - a.percentageChange;
				}
				return 0;
			})
	);

	$inspect(filteredMarketHistory);
</script>

<div class="rounded-lg shadow-lg font-inter">
	<div class="w-full flex flex-col space-y-2">
		<div
			class="flex flex-col sm:flex-row sm:space-x-2 items-center justify-end space-y-2 sm:space-y-0"
		>
			<select class="select w-full sm:max-w-[120px]" bind:value={selectedDateRange}>
				<option disabled selected>Select Date Range</option>
				<option>1 hour</option>
				<option>12 hour</option>
				<option>24 hour</option>
				<option>7 days</option>
				<option>All</option>
			</select>
			<select class="select w-full sm:max-w-[200px]" bind:value={selectedFilter}>
				<option disabled selected>Select Filter</option>
				<option>Price</option>
				<option>Name</option>
				<option>Percentage Change</option>
			</select>
			<select class="select w-full sm:max-w-[150px]" bind:value={selectedFilterType}>
				<option disabled selected>Select Filter Type</option>
				<option>Low to High</option>
				<option>High to Low</option>
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
					<div class="text-right">
						${Number(item.price).toLocaleString(undefined, {
							minimumFractionDigits: 2,
							maximumFractionDigits: 2
						})}
					</div>
					<div class="text-right">
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
