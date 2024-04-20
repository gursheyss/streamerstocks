<script lang="ts">
	import { toast } from 'svelte-sonner';
	import { Tabs } from 'bits-ui';

	let {
		currentPrice,
		stockID,
		ticker,
		name,
		signedIn,
		userBalance,
		userSharesAmount
	}: {
		stockID: number;
		currentPrice: number;
		userBalance: number | null;
		userSharesAmount: number | null;
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

	function handleInput(event: Event & { currentTarget: EventTarget & HTMLInputElement }) {
		let inputElement = event.currentTarget;
		let inputValue = inputElement.value.replace(/[^\d.]/g, '');
		let decimalIndex = inputValue.indexOf('.');
		if (decimalIndex !== -1) {
			inputValue = inputValue.slice(0, decimalIndex + 4);
		}
		amount = Number(inputValue);
		if (amount > 1000) {
			amount = 1000;
		} else if (inputValue === '') {
			amount = '';
		}
	}
</script>

<div class="pt-4 pr-4 font-inter">
	<div class="pt-4 pr-4 font-inter">
		<Tabs.Root class="p-3 w-full border-2 rounded-[9px] border-lightgray">
			<Tabs.List
				class="grid w-full grid-cols-2 gap-1 rounded-9px bg-dark-10 p-1 text-sm font-semibold leading-[0.01em]"
			>
				<Tabs.Trigger
					value="buy"
					class="h-8 rounded-l-[7px] bg-transparent py-2 data-[state=active]:bg-lightgray data-[state=active]:text-green-400"
				>
					Buy
				</Tabs.Trigger>
				<Tabs.Trigger
					value="sell"
					class="h-8 rounded-r-[7px] bg-transparent py-2 data-[state=active]:bg-lightgray data-[state=active]:text-red-400"
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
						oninput={handleInput}
					/>
					<div class="flex justify-between mt-2">
						<button
							class="w-1/4 inline-flex items-center justify-center p-0.5 overflow-hidden text-xs text-white bg-lightgray hover:bg-gray-700 border-r border-gray-600 rounded-l-md"
							onclick={() => {
								if (userBalance) {
									amount = (Math.floor((userBalance * 250) / currentPrice) / 1000).toLocaleString(
										undefined,
										{
											minimumFractionDigits: 0,
											maximumFractionDigits: 3
										}
									);
								}
							}}
						>
							<span
								class="relative px-2 py-1 transition-all ease-in duration-75 group-hover:bg-opacity-0"
								>25%</span
							>
						</button>
						<button
							class="w-1/4 inline-flex items-center justify-center p-0.5 overflow-hidden text-xs text-white bg-lightgray hover:bg-gray-700 border-r border-gray-600"
							onclick={() => {
								if (userBalance) {
									amount = (Math.floor((userBalance * 500) / currentPrice) / 1000).toLocaleString(
										undefined,
										{
											minimumFractionDigits: 0,
											maximumFractionDigits: 3
										}
									);
								}
							}}
						>
							<span
								class="relative px-2 py-1 transition-all ease-in duration-75 group-hover:bg-opacity-0"
								>50%</span
							>
						</button>
						<button
							class="w-1/4 inline-flex items-center justify-center p-0.5 overflow-hidden text-xs text-white bg-lightgray hover:bg-gray-700 border-r border-gray-600"
							onclick={() => {
								if (userBalance) {
									amount = (Math.floor((userBalance * 750) / currentPrice) / 1000).toLocaleString(
										undefined,
										{
											minimumFractionDigits: 0,
											maximumFractionDigits: 3
										}
									);
								}
							}}
						>
							<span
								class="relative px-2 py-1 transition-all ease-in duration-75 group-hover:bg-opacity-0"
								>75%</span
							>
						</button>
						<button
							class="w-1/4 inline-flex items-center justify-center p-0.5 overflow-hidden text-xs text-white bg-lightgray hover:bg-gray-700 border-gray-600 rounded-r-md"
							onclick={() => {
								if (userBalance) {
									amount = (Math.floor((userBalance * 1000) / currentPrice) / 1000).toLocaleString(
										undefined,
										{
											minimumFractionDigits: 0,
											maximumFractionDigits: 3
										}
									);
								}
							}}
						>
							<span
								class="relative px-2 py-1 transition-all ease-in duration-75 group-hover:bg-opacity-0"
								>Max</span
							>
						</button>
					</div>
					<div class="text-xs text-center text-gray-400 mt-2">
						<span>${ticker} Owned:</span>
						<span
							>{userSharesAmount
								? userSharesAmount.toLocaleString(undefined, {
										minimumFractionDigits: 0,
										maximumFractionDigits: 3
									})
								: 0}</span
						>
					</div>
					<div class="mt-2 text-sm text-gray-400">
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
							class="mt-4 w-full relative inline-flex items-center justify-center p-0.5 overflow-hidden text-sm text-white rounded-lg bg-lightgray hover:bg-gray-700"
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
						oninput={handleInput}
					/>
					<div class="flex justify-between mt-2">
						<button
							class="w-1/4 inline-flex items-center justify-center p-0.5 overflow-hidden text-xs text-white bg-lightgray hover:bg-gray-700 border-r border-gray-600 rounded-l-md"
							onclick={() => {
								if (userSharesAmount) {
									amount = (userSharesAmount * 0.25).toLocaleString(undefined, {
										minimumFractionDigits: 0,
										maximumFractionDigits: 3
									});
								}
							}}
						>
							<span
								class="relative px-2 py-1 transition-all ease-in duration-75 group-hover:bg-opacity-0"
								>25%</span
							>
						</button>
						<button
							class="w-1/4 inline-flex items-center justify-center p-0.5 overflow-hidden text-xs text-white bg-lightgray hover:bg-gray-700 border-r border-gray-600"
							onclick={() => {
								if (userSharesAmount) {
									amount = (userSharesAmount * 0.5).toLocaleString(undefined, {
										minimumFractionDigits: 0,
										maximumFractionDigits: 3
									});
								}
							}}
						>
							<span
								class="relative px-2 py-1 transition-all ease-in duration-75 group-hover:bg-opacity-0"
								>50%</span
							>
						</button>
						<button
							class="w-1/4 inline-flex items-center justify-center p-0.5 overflow-hidden text-xs text-white bg-lightgray hover:bg-gray-700 border-r border-gray-600"
							onclick={() => {
								if (userSharesAmount) {
									amount = (userSharesAmount * 0.75).toLocaleString(undefined, {
										minimumFractionDigits: 0,
										maximumFractionDigits: 3
									});
								}
							}}
						>
							<span
								class="relative px-2 py-1 transition-all ease-in duration-75 group-hover:bg-opacity-0"
								>75%</span
							>
						</button>
						<button
							class="w-1/4 inline-flex items-center justify-center p-0.5 overflow-hidden text-xs text-white bg-lightgray hover:bg-gray-700 border-gray-600 rounded-r-md"
							onclick={() => {
								if (userSharesAmount) {
									amount = userSharesAmount.toLocaleString(undefined, {
										minimumFractionDigits: 0,
										maximumFractionDigits: 3
									});
								}
							}}
						>
							<span
								class="relative px-2 py-1 transition-all ease-in duration-75 group-hover:bg-opacity-0"
								>Max</span
							>
						</button>
					</div>
					<div class="text-xs text-center text-gray-400 mt-2">
						<span>${ticker} Owned:</span>
						<span
							>{userSharesAmount
								? userSharesAmount.toLocaleString(undefined, {
										minimumFractionDigits: 0,
										maximumFractionDigits: 3
									})
								: 0}</span
						>
					</div>
					<div class="mt-2 text-sm text-gray-400">
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
							class="mt-4 w-full relative inline-flex items-center justify-center p-0.5 overflow-hidden text-sm text-white rounded-lg bg-lightgray hover:bg-gray-700"
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
</div>
