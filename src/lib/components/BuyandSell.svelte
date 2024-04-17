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
	let preview = $state({ subtotal: 0, fee: 0, total: 0 });
	let mode = $state('buy');
	const feeRate = 0.01;

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
		// Convert the amount to a positive number for calculations
		let numericAmount = Math.abs(amountToBuyOrSell);
		amountToBuyOrSell = mode === 'buy' ? amountToBuyOrSell : -amountToBuyOrSell;
		const bondingCurveCoefficient = 160000;
		const feeRate = 0.01; // 1% fee rate
		// Calculate the current number of shares based on the bonding curve
		const currentShares = Math.sqrt(currentPrice * bondingCurveCoefficient);
		// Calculate new shares and new price based on whether the action is buying or selling
		let newShares, newPrice;
		if (amountToBuyOrSell < 0) {
			// Buying shares
			newShares = currentShares + numericAmount;
			const subtotal = numericAmount * currentPrice;
			const fee = subtotal * feeRate;
			const total = subtotal + fee;
			newPrice = total / numericAmount;
		} else {
			// Selling shares
			newShares = currentShares - numericAmount;
			if (newShares < 0) {
				newShares = 0;
			}
			newPrice = Math.pow(newShares, 2) / bondingCurveCoefficient;
			const fee = (currentPrice - newPrice) * feeRate;
			newPrice = currentPrice - fee;
		}
		// Calculate the subtotal, fee, and total based on the new price
		const subtotal = numericAmount * currentPrice;
		const fee = subtotal * feeRate;
		const total = amountToBuyOrSell > 0 ? subtotal + fee : subtotal - fee;
		// Update the preview object
		preview.subtotal = subtotal;
		preview.fee = fee;
		preview.total = total;
	}

	function handleInput(event: Event & { currentTarget: EventTarget & HTMLInputElement }) {
		let inputElement = event.currentTarget;
		amount = inputElement.value.replace(/\D/g, '');
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
				Buy
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
				Sell
			</span>
		</button>
	</div>
	<div class="h-4">
		<!-- {#if amount}
			<p class="text-sm text-gray-400">
				{Number(amount).toLocaleString()} @ ${Number(currentPrice.toFixed(2)).toLocaleString()} = ${(
					currentPrice * Number(amount)
				).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
			</p>
			<p class="text-sm text-gray-400">
				Subtotal: ${preview.subtotal.toLocaleString(undefined, {
					minimumFractionDigits: 2,
					maximumFractionDigits: 2
				})}
			</p>
			<p class="text-sm text-gray-400">
				Estimated Fee: ${preview.fee.toLocaleString(undefined, {
					minimumFractionDigits: 2,
					maximumFractionDigits: 2
				})}
			</p>
			<p class="text-sm text-gray-400">
				Total: ${preview.total.toLocaleString(undefined, {
					minimumFractionDigits: 2,
					maximumFractionDigits: 2
				})}
			</p>
		{/if} -->
	</div>
</div>