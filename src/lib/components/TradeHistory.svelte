<script lang="ts">
	let { tradeHistory } = $props();

	function handleRowClick(ticker: string) {
		window.location.href = `/stock/${ticker}`;
	}
</script>

<div class="bg-gray2 shadow overflow-hidden sm:rounded-lg p-6 overflow-x-auto">
	<h3 class="text-lg leading-6 font-medium text-gray-100 mb-4">Trade History</h3>
	<table class="min-w-full divide-y divide-gray-700">
		<thead class="bg-gray2">
			<tr>
				<th class="px-6 py-3 text-left text-xs font-medium text-gray-100 uppercase tracking-wider"
					>Ticker</th
				>
				<th class="px-6 py-3 text-left text-xs font-medium text-gray-100 uppercase tracking-wider"
					>Status</th
				>
				<th class="px-6 py-3 text-left text-xs font-medium text-gray-100 uppercase tracking-wider"
					>Price</th
				>
				<th class="px-6 py-3 text-left text-xs font-medium text-gray-100 uppercase tracking-wider"
					>Volume</th
				>
				<th class="px-6 py-3 text-left text-xs font-medium text-gray-100 uppercase tracking-wider"
					>Date</th
				>
			</tr>
		</thead>
		<tbody class="bg-gray2 divide-y divide-gray-700">
			{#each tradeHistory as trade}
				<tr class="hover:bg-lightgray cursor-pointer" on:click={() => handleRowClick(trade.ticker)}>
					<td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-100"
						>{trade.ticker}</td
					>
					<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-100">{trade.status}</td>
					<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-100">
						{trade.bought_price
							? trade.bought_price.toFixed(2)
							: trade.sold_price
								? trade.sold_price.toFixed(2)
								: '-'}
					</td>
					<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-100"
						>{trade.purchase_volume || trade.sale_volume || '-'}</td
					>
					<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-100"
						>{new Date(trade.date_purchased).toLocaleString()}</td
					>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
