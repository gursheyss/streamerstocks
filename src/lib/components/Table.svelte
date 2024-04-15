<script lang="ts">
	import type { MarketItem, MarketItemHistory } from '$lib/types';
	import MiniChart from './MiniChart.svelte';

	let { marketData }: { marketData: MarketItem[] } = $props();

	function calculatePercentageChange(history: MarketItemHistory[]): number {
		if (!history || history.length === 0) {
			return 0; // Return 0 if history is undefined or empty
		}

		let currentPrice = history[history.length - 1]?.price || 0;
		let beginningPrice = history[0]?.price || 0;
		console.log(currentPrice, beginningPrice);

		if (beginningPrice === 0) {
			return 0; // Return 0 if beginningPrice is 0 to avoid division by zero
		}

		return ((currentPrice - beginningPrice) / beginningPrice) * 100;
	}

	let selectedFilter = $state('Price');
	let selectedFilterType = $state('Descending');
	let searchFilter = $state('');

	let filteredMarketData = $derived(
		marketData
			.filter((item) => {
				// Apply search filter
				const searchTerm = searchFilter.toLowerCase();
				return (
					item.name.toLowerCase().includes(searchTerm) ||
					item.ticker.toLowerCase().includes(searchTerm)
				);
			})
			.map((item) => {
				return {
					...item,
					percentageChange: calculatePercentageChange(item.history)
				};
			})
			.sort((a, b) => {
				if (selectedFilter === 'Price') {
					return selectedFilterType === 'Ascending' ? a.price - b.price : b.price - a.price;
				} else if (selectedFilter === 'Name') {
					return selectedFilterType === 'Ascending'
						? a.name.localeCompare(b.name)
						: b.name.localeCompare(a.name);
				} else if (selectedFilter === 'Percentage Change') {
					return selectedFilterType === 'Ascending'
						? a.percentageChange - b.percentageChange
						: b.percentageChange - a.percentageChange;
				}
				return 0;
			})
	);
</script>

<div class="rounded-lg shadow-lg font-inter">
	<div class="w-full flex flex-col space-y-2">
		<div
			class="flex flex-col sm:flex-row sm:space-x-2 items-center justify-end space-y-2 sm:space-y-0"
		>
			<input type="text" class="input w-full" placeholder="Search" bind:value={searchFilter} />
			<select class="select w-full sm:max-w-[200px]" bind:value={selectedFilter}>
				<option disabled selected>Select Filter</option>
				<option>Price</option>
				<option>Name</option>
				<option>Percentage Change</option>
			</select>
			<select class="select w-full sm:max-w-[150px]" bind:value={selectedFilterType}>
				<option disabled selected>Select Filter Type</option>
				<option>Ascending</option>
				<option>Descending</option>
			</select>
		</div>
		{#each filteredMarketData as item}
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
						<div class="order-2 sm:order-1">${item.price.toFixed(2).toLocaleString()}</div>
						<div class="order-1 sm:order-2">
							{#if item.percentageChange > 0}
								<span class="text-green-500">+{item.percentageChange.toFixed(2)}%</span>
							{:else if item.percentageChange < 0}
								<span class="text-red-500">{item.percentageChange.toFixed(2)}%</span>
							{:else}
								<span class="text-gray-400">0%</span>
							{/if}
						</div>
					</div>
					<div class="w-24 h-24 mx-auto">
						<MiniChart stockData={item.history} />
					</div>
				</div>
			</a>
		{/each}
	</div>
</div>
