<script lang="ts">
	import { toast } from 'svelte-sonner';
	import { Tabs } from 'bits-ui';

	let {
		currentPrice,
		stockID,
		ticker,
		name,
		signedIn
	}: {
		stockID: number;
		currentPrice: number;
		userBalance: number | null;
		ticker: string;
		name: string;
		signedIn: boolean;
	} = $props();

	let amount = $state('');
	let loading = $state(false);
	let preview = $state({ avgPricePerShare: 0, fee: 0, total: 0, priceImpact: 0 });

	async function updateStockAndBal(stockID: number, amt: number) {
		loading = true;
		const response = await fetch('/api/trade', {
			method: 'POST',
			body: JSON.stringify({ amt, stockID }),
			headers: {
				'Content-Type': 'application/json'
			}
		});
		const resp = await response.json();
		loading = false;
		if (resp['success'] == false) {
			toast.error('Please ensure that you have enough money to purchase or shares to sell.');
		} else if (amt < 0) {
			toast.success(`Congratulations! You have successfully purchased ${-amt} $${ticker}`);
		} else {
			toast.success(`Congratulations! You have successfuly sold ${amt} $${ticker}`);
		}
	}
</script>

<div class="pt-4 pr-4 font-inter">
	<Tabs.Root class="p-3 w-full border-2 rounded-[9px] border-lightgray">
		<Tabs.List
			class="grid w-full grid-cols-2 gap-1 rounded-9px bg-dark-10 p-1 text-sm font-semibold leading-[0.01em]"
		>
			<Tabs.Trigger
				value="buy"
				class="h-8 rounded-[7px] bg-transparent py-2 data-[state=active]:bg-lightgray"
			>
				Buy
			</Tabs.Trigger>
			<Tabs.Trigger
				value="sell"
				class="h-8 rounded-[7px] bg-transparent py-2 data-[state=active]:bg-lightgray"
			>
				Sell
			</Tabs.Trigger>
		</Tabs.List>

		<Tabs.Content value="buy">
			<div class="p-4">
				<div class="text-lg mb-4 flex justify-center space-x-2">
					<span class="font-semibold">{name}</span>
					<span class="text-gray-400">${ticker}</span>
				</div>
				<input
					class="w-full border text-center border-gray-600 bg-lightgray rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:lightgray"
					bind:value={amount}
					placeholder="Enter amount"
					required
					type="number"
					min="0"
				/>
				<div class="mt-4 text-sm text-gray-400">
					<div class="flex justify-between">
						<span>Price:</span>
						<span
							>${currentPrice.toLocaleString(undefined, {
								minimumFractionDigits: 2,
								maximumFractionDigits: 2
							})} / ${ticker}</span
						>
					</div>
					<div class="flex justify-between">
						<span>Total:</span>
						<span>
							{#if amount}
								${(currentPrice * Number(amount)).toLocaleString('en-US', {
									minimumFractionDigits: 2,
									maximumFractionDigits: 2
								})}
							{:else}
								-
							{/if}
						</span>
					</div>
					<button
						class="mt-4 w-full relative inline-flex items-center justify-center p-0.5 overflow-hidden text-sm text-white rounded-lg bg-lightgray"
						onclick={() => updateStockAndBal(stockID, -Number(amount))}
						disabled={loading}
					>
						<span
							class="relative px-5 py-2.5 transition-all ease-in duration-75 rounded-md group-hover:bg-opacity-0"
							>Buy {amount} ${ticker}</span
						>
					</button>
				</div>
			</div>
		</Tabs.Content>

		<Tabs.Content value="sell">
			<div class="p-4">
				<div class="text-lg mb-4 flex justify-center space-x-2">
					<span class="font-semibold">{name}</span>
					<span class="text-gray-400">${ticker}</span>
				</div>
				<input
					class="w-full border text-center border-gray-600 bg-lightgray rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:lightgray"
					bind:value={amount}
					placeholder="Enter amount"
					type="number"
					required
					min="0"
				/>
				<div class="mt-4 text-sm text-gray-400">
					<div class="flex justify-between">
						<span>Price:</span>
						<span
							>${currentPrice.toLocaleString(undefined, {
								minimumFractionDigits: 2,
								maximumFractionDigits: 2
							})} / {ticker}</span
						>
					</div>
					<div class="flex justify-between">
						<span>Fee:</span>
						<span>
							{#if amount}
								${(currentPrice * Number(amount) * 0.01).toLocaleString('en-US', {
									minimumFractionDigits: 2,
									maximumFractionDigits: 2
								})}
							{:else}
								-
							{/if}
						</span>
					</div>
					<div class="flex justify-between">
						<span>Total:</span>
						<span>
							{#if amount}
								${(currentPrice * Number(amount) * 0.99).toLocaleString('en-US', {
									minimumFractionDigits: 2,
									maximumFractionDigits: 2
								})}
							{:else}
								-
							{/if}
						</span>
					</div>
					<button
						class="mt-4 w-full relative inline-flex items-center justify-center p-0.5 overflow-hidden text-sm text-white rounded-lg bg-lightgray"
						onclick={() => updateStockAndBal(stockID, Number(amount))}
						disabled={loading}
					>
						<span
							class="relative px-5 py-2.5 transition-all ease-in duration-75 rounded-md group-hover:bg-opacity-0"
							>Sell {amount} ${ticker}</span
						>
					</button>
				</div>
			</div>
		</Tabs.Content>
	</Tabs.Root>
</div>
