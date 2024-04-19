<script lang="ts">
	import { toast } from 'svelte-sonner';
	import { Tabs } from 'bits-ui';

	let {
		currentPrice,
		stockID,
		ticker,
		name
	}: { stockID: number; currentPrice: number; userBalance: number; ticker: string; name: string } =
		$props();
	let amount = $state('');
	let loading = $state(false);
	let preview = $state({ avgPricePerShare: 0, fee: 0, total: 0, priceImpact: 0 });

	async function updateStockAndBal(stockID: number, amt: number) {
		loading = true;
		const response = await fetch('/api/trade', {
			method: 'POST',
			body: JSON.stringify({ amt, stockID }),
			headers: { 'Content-Type': 'application/json' }
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

	function handleInput(event: Event & { currentTarget: EventTarget & HTMLInputElement }) {
		let inputElement = event.currentTarget;
		amount = inputElement.value.replace(/\D/g, '');
		if (Number(amount) > 1000) {
			amount = '1000';
		}
	}
</script>

<div class="pt-6">
	<Tabs.Root class="p-3 w-full">
		<Tabs.List
			class="grid w-full grid-cols-2 gap-1 rounded-9px bg-dark-10 p-1 text-sm font-semibold leading-[0.01em]  "
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

		<Tabs.Content value="buy" class="pt-3">
			<div class="p-4">
				<input
					class="w-full border border-gray-600 bg-lightgray rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:lightgray"
					bind:value={amount}
					placeholder="Enter amount"
					required
				/>
				<button
					class="mt-4 w-full relative inline-flex items-center justify-center p-0.5 overflow-hidden text-sm text-white rounded-lg bg-lightgray"
					disabled={loading}
				>
					<span
						class="relative px-5 py-2.5 transition-all ease-in duration-75 rounded-md group-hover:bg-opacity-0"
					>
						Buy {ticker}
					</span>
				</button>

				{#if amount}
					<div class="mt-4 text-sm text-gray-400">
						<p>
							Price: ${currentPrice.toLocaleString(undefined, {
								minimumFractionDigits: 2,
								maximumFractionDigits: 2
							})} / {ticker}
						</p>
						<p>
							{Number(amount).toLocaleString()} @ ${Number(
								preview.avgPricePerShare.toFixed(2)
							).toLocaleString()} = ${(preview.avgPricePerShare * Number(amount)).toLocaleString(
								undefined,
								{ minimumFractionDigits: 2, maximumFractionDigits: 2 }
							)}
						</p>
						<p>
							Fee: ${preview.fee.toLocaleString(undefined, {
								minimumFractionDigits: 2,
								maximumFractionDigits: 2
							})}
						</p>
						<p>
							Total: ${preview.total.toLocaleString(undefined, {
								minimumFractionDigits: 2,
								maximumFractionDigits: 2
							})}
						</p>
					</div>
				{/if}
			</div>
		</Tabs.Content>

		<Tabs.Content value="sell" class="pt-3">
			<div class="p-4">
				<input
					class="w-full border border-gray-600 bg-lightgray rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:lightgray"
					bind:value={amount}
					placeholder="Enter amount"
					oninput={handleInput}
					required
				/>
				<button
					class="mt-4 w-full relative inline-flex items-center justify-center p-0.5 overflow-hidden text-sm font-medium text-gray-900 rounded-lg group bg-gradient-to-br from-pink-500 to-orange-400 group-hover:from-pink-500 group-hover:to-orange-400 hover:text-white dark:text-white focus:ring-4 focus:outline-none focus:ring-pink-200 dark:focus:ring-pink-800"
					onclick={() => updateStockAndBal(stockID, -Number(amount))}
					disabled={loading}
				>
					<span
						class="relative px-5 py-2.5 transition-all ease-in duration-75 bg-white dark:bg-gray-900 rounded-md group-hover:bg-opacity-0"
					>
						Sell {ticker}
					</span>
				</button>

				{#if amount}
					<div class="mt-4 text-sm text-gray-400">
						<p>
							Price: ${currentPrice.toLocaleString(undefined, {
								minimumFractionDigits: 2,
								maximumFractionDigits: 2
							})} / {ticker}
						</p>
						<p>
							{Number(amount).toLocaleString()} @ ${Number(
								preview.avgPricePerShare.toFixed(2)
							).toLocaleString()} = ${(preview.avgPricePerShare * Number(amount)).toLocaleString(
								undefined,
								{ minimumFractionDigits: 2, maximumFractionDigits: 2 }
							)}
						</p>
						<p>
							Fee: ${preview.fee.toLocaleString(undefined, {
								minimumFractionDigits: 2,
								maximumFractionDigits: 2
							})}
						</p>
						<p>
							Total: ${preview.total.toLocaleString(undefined, {
								minimumFractionDigits: 2,
								maximumFractionDigits: 2
							})}
						</p>
					</div>
				{/if}
			</div>
		</Tabs.Content>
	</Tabs.Root>
</div>
