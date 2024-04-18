<script lang="ts">
	import { toast } from 'svelte-sonner';
	import { se } from 'date-fns/locale';

	let {
		uuid,
		currentPrice,
		stockID,
		ticker
	}: { uuid: string; stockID: number; currentPrice: number; userBalance: number; ticker: string } =
		$props();
	let amount = $state('');
	let loading = $state(false);
	let preview = $state({ avgPricePerShare: 0, fee: 0, total: 0, priceImpact: 0 });
	let mode = $state('buy');

	async function updateStockAndBal(uuid: string, stockID: number, amt: number) {
		loading = true;
		const response = await fetch('/api/trade', {
			method: 'POST',
			body: JSON.stringify({ uuid, amt, stockID }),
			headers: { 'Content-Type': 'application/json' }
		});
		const resp = await response.json();
		loading = false;
		if (resp['success'] == false) {
			toast.error('Please ensure that you have enough money to purchase or shares to sell.');
		} else if (amt > 0) {
			toast.success(`Congratulations! You have successfully purchased ${amt} $${ticker}`);
		} else {
			toast.success(`Congratulations! You have successfuly sold ${-amt} $${ticker}`);
		}
	}

	function calculatePreview(amountToBuyOrSell: number) {
		let numericAmount = Math.abs(amountToBuyOrSell);
		const bondingCurveCoefficient = 240000;
		const feeRate = 0.001; // Fee rate updated to 0.1%
		let currentShares = Math.sqrt(currentPrice * bondingCurveCoefficient);
		let totalCost = 0;
		let newPrice = currentPrice;
		let newShares;
		let avgPricePerShare = 0;

		if (mode === 'buy') {
			// Buying shares
			for (let i = 0; i < numericAmount; i++) {
				newShares = currentShares + 1; // Increment shares one by one
				newPrice = newShares ** 2 / bondingCurveCoefficient;
				totalCost += newPrice; // Accumulate total cost
				currentShares = newShares; // Update current shares
			}
			totalCost += totalCost * feeRate; // Apply fee to the total cost
			avgPricePerShare = totalCost / numericAmount; // Average price per share including fee
		} else {
			// Selling shares
			for (let i = 0; i < numericAmount; i++) {
				newShares = currentShares - 1; // Decrement shares one by one
				if (newShares < 0) newShares = 0; // Ensure shares do not go negative
				newPrice = newShares ** 2 / bondingCurveCoefficient;
				totalCost += newPrice; // Accumulate total cost
				currentShares = newShares; // Update current shares
			}
			totalCost -= totalCost * feeRate; // Apply fee to the total cost
			avgPricePerShare = totalCost / numericAmount; // Average price per share including fee
		}

		// Update the preview object
		preview.avgPricePerShare = avgPricePerShare;
		preview.total = totalCost;
		preview.priceImpact = ((newPrice - currentPrice) / currentPrice) * 100; // Optionally show new price impact
	}

	function handleInput(event: Event & { currentTarget: EventTarget & HTMLInputElement }) {
		let inputElement = event.currentTarget;
		amount = inputElement.value.replace(/\D/g, '');
		if (Number(amount) > 1000) {
			amount = '1000';
		}
		calculatePreview(Number(amount));
	}

	function handleModeChange(newMode: 'buy' | 'sell') {
		mode = newMode;
		calculatePreview(Number(amount));
	}
</script>

<div class="flex flex-col justify-center items-center gap-4 font-inter">
	<div class="flex justify-center items-center gap-4">
		<input
			class="w-32 sm:w-56 border border-gray-600 bg-lightgray rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:lightgray"
			bind:value={amount}
			placeholder="Enter # of Stocks"
			on:input={handleInput}
			required
		/>
		<button
			class="relative inline-flex items-center justify-center p-0.5 overflow-hidden text-sm font-medium text-gray-900 rounded-lg group bg-gradient-to-br from-teal-300 to-lime-300 group-hover:from-teal-300 group-hover:to-lime-300 dark:text-white dark:hover:text-gray-900 focus:ring-4 focus:outline-none focus:ring-lime-200 dark:focus:ring-lime-800"
			on:click={() => updateStockAndBal(uuid, stockID, Number(amount))}
			disabled={loading}
		>
			<span
				class="relative px-5 py-2.5 transition-all ease-in duration-75 bg-white dark:bg-gray-900 rounded-md group-hover:bg-opacity-0"
			>
				Buy {ticker}
			</span>
		</button>
		<button
			class="relative inline-flex items-center justify-center p-0.5 overflow-hidden text-sm font-medium text-gray-900 rounded-lg group bg-gradient-to-br from-pink-500 to-orange-400 group-hover:from-pink-500 group-hover:to-orange-400 hover:text-white dark:text-white focus:ring-4 focus:outline-none focus:ring-pink-200 dark:focus:ring-pink-800"
			on:click={() => updateStockAndBal(uuid, stockID, -Number(amount))}
			disabled={loading}
		>
			<span
				class="relative px-5 py-2.5 transition-all ease-in duration-75 bg-white dark:bg-gray-900 rounded-md group-hover:bg-opacity-0"
			>
				Sell {ticker}
			</span>
		</button>
	</div>
	<div class="h-4">
		{#if amount}
			<p class="text-sm text-gray-400">
				Average Price per Share: ${preview.avgPricePerShare.toLocaleString(undefined, {
					minimumFractionDigits: 2,
					maximumFractionDigits: 2
				})}
			</p>
			<p class="text-sm text-gray-400">
				{Number(amount).toLocaleString()} @ ${Number(
					preview.avgPricePerShare.toFixed(2)
				).toLocaleString()} = ${(preview.avgPricePerShare * Number(amount)).toLocaleString(
					undefined,
					{ minimumFractionDigits: 2, maximumFractionDigits: 2 }
				)}
			</p>
			<p class="text-sm text-gray-400">
				Total: ${preview.total.toLocaleString(undefined, {
					minimumFractionDigits: 2,
					maximumFractionDigits: 2
				})}
			</p>
			<!-- <p class="text-sm text-gray-400">
				Estimated Fee: ${preview.fee.toLocaleString(undefined, {
					minimumFractionDigits: 2,
					maximumFractionDigits: 2
				})}
			</p> -->
			<!-- <p
				class={preview.priceImpact > 0
					? 'text-xs text-green-400'
					: preview.priceImpact < 0
						? 'text-xs text-red-400'
						: 'text-xs text-gray-400'}
			>
				Price Impact: {preview.priceImpact >= 0 ? '+' : '-'}{preview.priceImpact.toLocaleString(
					undefined,
					{
						minimumFractionDigits: 2,
						maximumFractionDigits: 2
					}
				)}%
			</p> -->
		{/if}
	</div>
</div>
