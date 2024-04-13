<script lang="ts">
	import { se } from 'date-fns/locale';

	let {
		uuid,
		stockID,
		currentPrice,
		userBalance,
		ticker
	}: { uuid: string; stockID: number; currentPrice: number; userBalance: number; ticker: string } =
		$props();
	let amount: string = $state('');
	let buy = $state(false);
	let failed = $state(false);
	let buySuccess = $state(false);
	let sellSuccess = $state(false);
	let boughtQuantity = $state(0);
	let soldQuantity = $state(0);
	let confirmation = $state(false);
	async function updateStockAndBal(uuid: string, stockID: number, amt: number) {
		confirmation = false;
		const response = await fetch('/api/trade', {
			method: 'POST',
			body: JSON.stringify({
				uuid,
				amt,
				stockID
			}),
			headers: {
				'Content-Type': 'application/json'
			}
		});
		const resp = await response.json();
		if (resp['success'] == false) {
			failed = true;
		} else if (amt < 0) {
			buySuccess = true;
			boughtQuantity = -amt;
		} else {
			sellSuccess = true;
			soldQuantity = amt;
		}
	}
	function handleInput(event) {
		// Remove non-numeric characters from the input
		amount = event.target.value.replace(/\D/g, '');
	}
	function reset() {
		buySuccess = false;
		sellSuccess = false;
	}
	async function handleConfirmation(amt: number) {
		if (amt < 0) {
			confirmation = true;
			buy = true;
		} else if (amt > 0) {
			confirmation = true;
			buy = false;
		}
	}
</script>

<div>
	<div class="flex justify-center">
		<input
			class="w-56 border border-gray-600 bg-lightgray rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:lightgray mr-2"
			bind:value={amount}
			placeholder="Enter # of Stocks"
			on:input={handleInput}
			required
		/>
	</div>
	<div class="flex justify-end gap-4">
		<button
			class="relative inline-flex items-center justify-center p-0.5 mb-2 me-2 overflow-hidden text-sm font-medium text-gray-900 rounded-lg group bg-gradient-to-br from-teal-300 to-lime-300 group-hover:from-teal-300 group-hover:to-lime-300 dark:text-white dark:hover:text-gray-900 focus:ring-4 focus:outline-none focus:ring-lime-200 dark:focus:ring-lime-800"
			on:click={() => handleConfirmation(-Number(amount))}
		>
			<span
				class="relative px-5 py-2.5 transition-all ease-in duration-75 bg-white dark:bg-gray-900 rounded-md group-hover:bg-opacity-0"
			>
				Buy
			</span>
		</button>
		<button
			class="relative inline-flex items-center justify-center p-0.5 mb-2 me-2 overflow-hidden text-sm font-medium text-gray-900 rounded-lg group bg-gradient-to-br from-pink-500 to-orange-400 group-hover:from-pink-500 group-hover:to-orange-400 hover:text-white dark:text-white focus:ring-4 focus:outline-none focus:ring-pink-200 dark:focus:ring-pink-800"
			on:click={() => handleConfirmation(Number(amount))}
		>
			<span
				class="relative px-5 py-2.5 transition-all ease-in duration-75 bg-white dark:bg-gray-900 rounded-md group-hover:bg-opacity-0"
			>
				Sell
			</span>
		</button>
	</div>
</div>
{#if confirmation}
	<div class="relative z-10" aria-labelledby="modal-title" role="dialog" aria-modal="true">
		<div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>

		<div class="fixed inset-0 z-10 w-screen overflow-y-auto border-gray-600">
			<div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
				<div
					class="relative transform overflow-hidden rounded-lg text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg"
				>
					<div class="bg-gray-600 px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
						<div class="sm:flex sm:items-start">
							<div class="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
								<h3 class="text-base font-semibold leading-6 text-white" id="modal-title">
									Confirmation
								</h3>
								<div class="mt-2">
									{#if buy}
										<p class="text-sm text-white">
											Are you sure you want to buy {amount} shares of ${ticker}?
										</p>
									{:else}
										<p class="text-sm text-white">
											Are you sure you want to sell {amount} shares of ${ticker}?
										</p>
									{/if}
								</div>
							</div>
						</div>
					</div>
					<div class="bg-gray-600 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
						<button
							type="button"
							class="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto"
							on:click={() => (confirmation = false)}>NO</button
						>
						{#if buy}
							<button
								type="button"
								class="mt-3 inline-flex w-full justify-center rounded-md bg-emerald-500 px-3 py-2 text-sm font-semibold text-white shadow-sm ring-1 ring-inset hover:bg-emerald-400 sm:mt-0 sm:w-auto"
								on:click={() => updateStockAndBal(uuid, stockID, -Number(amount))}>YES</button
							>
						{:else}
							<button
								type="button"
								class="mt-3 inline-flex w-full justify-center rounded-md bg-emerald-500 px-3 py-2 text-sm font-semibold text-white shadow-sm ring-1 ring-inset hover:bg-emerald-400 sm:mt-0 sm:w-auto"
								on:click={() => updateStockAndBal(uuid, stockID, Number(amount))}>YES</button
							>
						{/if}
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}

{#if failed}
	<div class="relative z-10" aria-labelledby="modal-title" role="dialog" aria-modal="true">
		<div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>

		<div class="fixed inset-0 z-10 w-screen overflow-y-auto border-gray-600">
			<div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
				<div
					class="relative transform overflow-hidden rounded-lg text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg"
				>
					<div class="bg-gray-600 px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
						<div class="sm:flex sm:items-start">
							<div class="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
								<h3 class="text-base font-semibold leading-6 text-white" id="modal-title">
									Failure
								</h3>
								<div class="mt-2">Please ensure that you have enough Weeniebucks or BopStocks.</div>
							</div>
						</div>
					</div>
					<div class="bg-gray-600 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
						<button
							type="button"
							class="mt-3 inline-flex w-full justify-center rounded-md bg-emerald-500 px-3 py-2 text-sm font-semibold text-white shadow-sm ring-1 ring-inset hover:bg-emerald-400 sm:mt-0 sm:w-auto"
							on:click={() => (failed = false)}>OK</button
						>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}

{#if buySuccess || sellSuccess}
	<div class="relative z-10" aria-labelledby="modal-title" role="dialog" aria-modal="true">
		<div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>

		<div class="fixed inset-0 z-10 w-screen overflow-y-auto border-gray-600">
			<div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
				<div
					class="relative transform overflow-hidden rounded-lg text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg"
				>
					<div class="bg-gray-600 px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
						<div class="sm:flex sm:items-start">
							<div class="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
								<h3 class="text-base font-semibold leading-6 text-white" id="modal-title">
									Success
								</h3>
								{#if buySuccess}
									<div class="mt-2">
										Congratulations! You are now the proud owner of {boughtQuantity} ${ticker}
									</div>
								{:else}
									<div class="mt-2">
										Congratulations! You have sold {soldQuantity} ${ticker}
									</div>
								{/if}
							</div>
						</div>
					</div>
					<div class="bg-gray-600 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
						<button
							type="button"
							class="mt-3 inline-flex w-full justify-center rounded-md bg-emerald-500 px-3 py-2 text-sm font-semibold text-white shadow-sm ring-1 ring-inset hover:bg-emerald-400 sm:mt-0 sm:w-auto"
							on:click={() => reset()}>OK</button
						>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}
