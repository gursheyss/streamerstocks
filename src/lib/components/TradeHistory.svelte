<script lang="ts">
	let { tradeHistory } = $props();

	function handleRowClick(ticker: string) {
		window.location.href = `/stock/${ticker}`;
	}
</script>

<div class="bg-gray2 shadow overflow-hidden sm:rounded-lg">
	<div class="px-4 py-5 sm:px-6">
		<h3 class="text-lg leading-6 font-medium text-gray-100">Trade History</h3>
	</div>
	<table class="min-w-full">
		<thead class="bg-gray2">
			<tr>
				<th
					scope="col"
					class="px-6 py-3 text-left text-xs font-medium text-gray-100 uppercase tracking-wider"
					>Ticker</th
				>
				<th
					scope="col"
					class="px-6 py-3 text-left text-xs font-medium text-gray-100 uppercase tracking-wider"
					>Status</th
				>
				<th
					scope="col"
					class="px-6 py-3 text-left text-xs font-medium text-gray-100 uppercase tracking-wider"
					>Price</th
				>
				<th
					scope="col"
					class="px-6 py-3 text-left text-xs font-medium text-gray-100 uppercase tracking-wider"
					>Volume</th
				>
			</tr>
		</thead>
		<tbody class="bg-gray2">
			{#each tradeHistory as trade}
				<tr class="hover:bg-lightgray cursor-pointer" on:click={() => handleRowClick(trade.ticker)}>
					<td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-100"
						>{trade.ticker}</td
					>
					<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-100">{trade.status}</td>
					<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-100"
						>{trade.bought_price
							? trade.bought_price.toFixed(2)
							: trade.sold_price
								? trade.sold_price.toFixed(2)
								: '-'}</td
					>
					<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-100"
						>{trade.purchase_volume || trade.sale_volume || '-'}</td
					>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
