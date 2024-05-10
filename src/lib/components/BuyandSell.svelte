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
	let activeTab = $state('buy');

	async function updateStockAndBal(stockID: number, amt: number) {
		loading = true;
		try {
			const response = await fetch('/api/trade', {
				method: 'POST',
				body: JSON.stringify({ amt, stockID }),
				headers: {
					'Content-Type': 'application/json'
				}
			});

			if (response.ok) {
				const resp = await response.json();
				if (resp.success) {
					const actionText = amt < 0 ? 'purchased' : 'sold';
					const amountText = Math.abs(amt);
					toast.success(
						`Congratulations! You have successfully ${actionText} ${amountText} $${ticker}`
					);
				} else {
					toast.error('An unexpected error occurred.');
				}
			} else {
				const errorData = await response.json();
				switch (response.status) {
					case 401:
						toast.error('Unauthorized: Please log in to perform this action.');
						break;
					case 429:
						toast.error(errorData.message);
						break;
					case 400:
						toast.error(errorData.message);
						break;
					case 500:
						toast.error(errorData.message || 'An unexpected error occurred.');
						break;
					default:
						toast.error('An unexpected error occurred.');
				}
			}
		} catch (error) {
			console.error('Error:', error);
			toast.error('An unexpected error occurred. Please try again later.');
		} finally {
			loading = false;
		}
	}
	function calculatePreview(amountToBuyOrSell: number) {
		const bondingCurveCoefficient = 160000;
		const feeRate = 0.001; // 0.1% fee rate
		const isBuying = activeTab === 'buy';
		const numericAmount = Math.abs(amountToBuyOrSell);
		const intAmount = Math.floor(numericAmount);
		const fractionalAmount = numericAmount - intAmount;

		// Calculate the current number of shares based on the bonding curve
		const currentShares = Math.sqrt(currentPrice * bondingCurveCoefficient);

		// Handle fractional shares
		let fractionalCost = 0;
		let newShares = currentShares;
		if (fractionalAmount > 0) {
			newShares += fractionalAmount;
			const newPrice = Math.pow(newShares, 2) / bondingCurveCoefficient;
			fractionalCost = fractionalAmount * newPrice * (isBuying ? 1 + feeRate : 1 - feeRate);
			newShares = currentShares + fractionalAmount;
		}

		// Handle whole shares
		let wholeCost = 0;
		for (let i = 0; i < intAmount; i++) {
			newShares = isBuying ? newShares + 1 : newShares - 1;
			const newPrice = Math.pow(newShares, 2) / bondingCurveCoefficient;
			wholeCost += newPrice;
		}
		wholeCost *= isBuying ? 1 + feeRate : 1 - feeRate;

		const total = fractionalCost + wholeCost;
		const priceImpact = Math.pow(newShares, 2) / bondingCurveCoefficient - currentPrice;

		preview = {
			avgPricePerShare: total / numericAmount,
			fee: (isBuying ? 1 : -1) * (fractionalCost * feeRate + wholeCost * feeRate),
			total,
			priceImpact
		};
	}
	// Helper function to compute maximum shares buyable within available balance
	function maxSharesBuyable(
		buyingPower: number,
		currentPrice: number,
		bondingCurveCoefficient: number,
		feeRate: number
	) {
		let shares = 0;
		let totalCost = 0;
		let currentShares = Math.sqrt(currentPrice * bondingCurveCoefficient);

		while (true) {
			const nextShares = currentShares + shares + 1;
			const nextSharePrice = Math.pow(nextShares, 2) / bondingCurveCoefficient;
			const nextTotalCost = totalCost + nextSharePrice * (1 + feeRate);

			if (nextTotalCost <= buyingPower) {
				shares += 1;
				totalCost = nextTotalCost;
				currentShares = nextShares;
			} else {
				const remainingBuyingPower = buyingPower - totalCost;
				const fractionalShares = remainingBuyingPower / (nextSharePrice * (1 + feeRate));
				shares += fractionalShares;
				break;
			}
		}

		return Math.floor(shares * 1000) / 1000;
	}

	// Modified calculatePercentage function
	function calculatePercentage(percentage: number) {
		let sharesToTrade = 0;
		if (activeTab === 'buy' && userBalance !== null) {
			const buyingPower = userBalance * percentage;
			sharesToTrade = maxSharesBuyable(buyingPower, currentPrice, 160000, 0.001);
		} else if (activeTab === 'sell' && userSharesAmount !== null) {
			sharesToTrade = Math.floor(userSharesAmount * percentage * 1000) / 1000;
		}
		amount = sharesToTrade.toLocaleString(undefined, {
			minimumFractionDigits: 0,
			maximumFractionDigits: 3
		});
		calculatePreview(Number(amount)); // Update the preview based on the new amount
	}
	function handleInput(event: Event & { currentTarget: EventTarget & HTMLInputElement }) {
		let inputElement = event.currentTarget;
		let inputValue = inputElement.value.replace(/[^\d.]/g, '');
		let decimalIndex = inputValue.indexOf('.');
		if (decimalIndex !== -1) {
			inputValue = inputValue.slice(0, decimalIndex + 4);
		}
		amount = String(inputValue);
		if (Number(amount) > 1000) {
			amount = '1000';
		} else if (inputValue === '') {
			amount = '';
		}
		calculatePreview(Number(amount));
	}
	function updateTab(tab: string) {
		activeTab = tab;
	}
</script>

<div class="pt-4 pr-4 font-inter">
	<div class="pt-4 pr-4 font-inter">
		<Tabs.Root class="p-3 w-full border-2 rounded-[9px] border-lightgray ">
			<Tabs.List
				class="grid w-full grid-cols-2 gap-1 rounded-9px bg-dark-10 p-1 text-sm font-semibold leading-[0.01em]"
			>
				<Tabs.Trigger
					value="buy"
					class="h-8 rounded-l-[7px] bg-transparent py-2 data-[state=active]:bg-lightgray data-[state=active]:text-green-400"
					on:click={() => updateTab('buy')}
				>
					Buy
				</Tabs.Trigger>
				<Tabs.Trigger
					value="sell"
					class="h-8 rounded-r-[7px] bg-transparent py-2 data-[state=active]:bg-lightgray data-[state=active]:text-red-400"
					on:click={() => updateTab('sell')}
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
						step="0.001"
					/>
					<div class="flex justify-between mt-2">
						<button
							class="w-1/4 inline-flex items-center justify-center p-0.5 overflow-hidden text-xs text-white bg-lightgray hover:bg-gray-700 border-r border-gray-600 rounded-l-md"
							onclick={() => calculatePercentage(0.25)}
						>
							<span
								class="relative px-2 py-1 transition-all ease-in duration-75 group-hover:bg-opacity-0"
								>25%</span
							>
						</button>
						<button
							class="w-1/4 inline-flex items-center justify-center p-0.5 overflow-hidden text-xs text-white bg-lightgray hover:bg-gray-700 border-r border-gray-600"
							onclick={() => calculatePercentage(0.5)}
						>
							<span
								class="relative px-2 py-1 transition-all ease-in duration-75 group-hover:bg-opacity-0"
								>50%</span
							>
						</button>
						<button
							class="w-1/4 inline-flex items-center justify-center p-0.5 overflow-hidden text-xs text-white bg-lightgray hover:bg-gray-700 border-r border-gray-600"
							onclick={() => calculatePercentage(0.75)}
						>
							<span
								class="relative px-2 py-1 transition-all ease-in duration-75 group-hover:bg-opacity-0"
								>75%</span
							>
						</button>
						<button
							class="w-1/4 inline-flex items-center justify-center p-0.5 overflow-hidden text-xs text-white bg-lightgray hover:bg-gray-700 border-gray-600 rounded-r-md"
							onclick={() => calculatePercentage(1)}
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
						<!-- avg price per share -->
						<div class="flex justify-between">
							<span>Avg Price Per Share:</span>
							<span>
								{#if amount}
									${preview.avgPricePerShare.toLocaleString('en-US', {
										minimumFractionDigits: 2,
										maximumFractionDigits: 2
									})}
								{:else}
									-
								{/if}
							</span>
						</div>
						<div class="flex justify-between">
							<span>Fee:</span>
							<span>
								{#if amount}
									${preview.fee.toLocaleString('en-US', {
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
									${preview.total.toLocaleString('en-US', {
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
							{#if loading}
								<span
									class="relative px-5 py-2.5 transition-all ease-in duration-75 rounded-md group-hover:bg-opacity-0"
									>Buying {amount} ${ticker}...</span
								>
							{:else}
								<span
									class="relative px-5 py-2.5 transition-all ease-in duration-75 rounded-md group-hover:bg-opacity-0"
									>Buy {amount} ${ticker}</span
								>
							{/if}
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
						step="0.001"
					/>
					<div class="flex justify-between mt-2">
						<button
							class="w-1/4 inline-flex items-center justify-center p-0.5 overflow-hidden text-xs text-white bg-lightgray hover:bg-gray-700 border-r border-gray-600 rounded-l-md"
							onclick={() => calculatePercentage(0.25)}
						>
							<span
								class="relative px-2 py-1 transition-all ease-in duration-75 group-hover:bg-opacity-0"
								>25%</span
							>
						</button>
						<button
							class="w-1/4 inline-flex items-center justify-center p-0.5 overflow-hidden text-xs text-white bg-lightgray hover:bg-gray-700 border-r border-gray-600"
							onclick={() => calculatePercentage(0.5)}
						>
							<span
								class="relative px-2 py-1 transition-all ease-in duration-75 group-hover:bg-opacity-0"
								>50%</span
							>
						</button>
						<button
							class="w-1/4 inline-flex items-center justify-center p-0.5 overflow-hidden text-xs text-white bg-lightgray hover:bg-gray-700 border-r border-gray-600"
							onclick={() => calculatePercentage(0.75)}
						>
							<span
								class="relative px-2 py-1 transition-all ease-in duration-75 group-hover:bg-opacity-0"
								>75%</span
							>
						</button>
						<button
							class="w-1/4 inline-flex items-center justify-center p-0.5 overflow-hidden text-xs text-white bg-lightgray hover:bg-gray-700 border-gray-600 rounded-r-md"
							onclick={() => calculatePercentage(1)}
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
									${preview.fee.toLocaleString('en-US', {
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
									${preview.total.toLocaleString('en-US', {
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
						>
							{#if loading}
								<span
									class="relative px-5 py-2.5 transition-all ease-in duration-75 rounded-md group-hover:bg-opacity-0"
									>Selling {amount} ${ticker}...</span
								>
							{:else}
								<span
									class="relative px-5 py-2.5 transition-all ease-in duration-75 rounded-md group-hover:bg-opacity-0"
									>Sell {amount} ${ticker}</span
								>
							{/if}
						</button>
					</div>
				</div>
			</Tabs.Content>
		</Tabs.Root>
	</div>
</div>
