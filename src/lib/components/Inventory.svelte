<script lang="ts">
	import { enhance } from '$app/forms';
	import type { InventoryItem } from '$lib/types';
	import { toast } from 'svelte-sonner';

	let loading = $state(false);

	let {
		inventoryData,
		currentUser,
		currentPortfolio
	}: { inventoryData: InventoryItem[]; currentUser: string; currentPortfolio: string } = $props();

	function handleRowClick(ticker: string) {
		window.location.href = `/stock/${ticker}`;
	}

	async function updateStockAndBal(ticker: string, stockID: number, amt: number) {
		loading = true;

		try {
			const response = await fetch('/api/trade', {
				method: 'POST',
				body: JSON.stringify({ amt, stockID }),
				headers: {
					'Content-Type': 'application/json'
				}
			});

			const resp = await response.json();

			if (response.ok) {
				if (resp['success'] == false) {
					toast.error(`Error: ${resp.message}`);
				} else {
					toast.success(`Congratulations! You have successfuly sold ${amt} $${ticker}`);
				}
			} else if (response.status === 401) {
				toast.error('Unauthorized: Please log in to perform this action.');
			} else if (response.status === 429) {
				toast.error(resp.message);
			} else {
				toast.error(`Error: ${resp.message}`);
			}
		} catch (error) {
			console.error('Error:', error);
			toast.error('An error occurred. Please try again later.');
		} finally {
			loading = false;
		}
	}
</script>

<div class="bg-gray2 rounded-lg shadow-lg font-inter p-4">
	<h2 class="text-xl font-bold text-white mb-4">Inventory</h2>
	<table class="w-full border-gray-700">
		<tbody>
			{#each inventoryData as item}
				<tr
					class="text-white font-bold items-center hover:bg-lightgray cursor-pointer"
					onclick={() => handleRowClick(item.market.ticker)}
				>
					<td class="items-center py-4 pl-4">
						<span>{item.market.name}</span>
						<span class="text-gray-400 ml-2">${item.market.ticker}</span>
					</td>
					<td class="text-right py-4"
						>{item.quantity} <span class="text-gray-400 ml-1">Shares</span></td
					>
					<td class="text-right py-4"
						>${(item.market.price * item.quantity).toFixed(2).toLocaleString()}</td
					>
					{#if currentUser === currentPortfolio}
						<td class="text-right pr-2">
							<button
								class="relative inline-flex items-center justify-center p-0.5 text-sm text-white rounded-lg bg-lightgray hover:bg-lightgray2"
								onclick={(event) => {
									event.stopPropagation();
									updateStockAndBal(item.market.ticker, Number(item.market.id), -item.quantity);
								}}
							>
								<span
									class="relative px-5 py-2.5 transition-all ease-in duration-75 rounded-md group-hover:bg-opacity-0"
									>Sell All</span
								>
							</button>
						</td>
					{/if}
				</tr>
			{/each}
		</tbody>
	</table>
</div>
