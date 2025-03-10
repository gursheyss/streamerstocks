<script lang="ts">
	import { page } from '$app/stores';
	import Chart from '$lib/components/Chart.svelte';
	import Comments from '$lib/components/Comments.svelte';
	import BuyandSell from '$lib/components/BuyandSell.svelte';
	import Portfolio from '$lib/components/Portfolio.svelte';
	import type { MarketItem, MarketItemHistory } from '$lib/types';
	import type { Comment } from '$lib/types';
	import type { InventoryItem } from '$lib/types';

	let { data } = $props();
	let { ticker } = $derived($page.params);
	let { supabase } = $derived(data);
	let selectedDateRange = $state('day');

	let marketData: MarketItem | null = $state(data.marketData);
	let comments: Comment[] = $state(data.comments);
	let userBalance = $state<number | null>(data.userBalance);
	let userSharesAmount = $state<number | null>(data.userSharesAmount);
	let inventoryData = $state<InventoryItem[] | null>(data.userInventory);
	let snapshotBalance = 0;
	if (userBalance != null) {
		snapshotBalance = userBalance;
	}
	function calcNW(x: InventoryItem[]): number {
		let total = 0;
		if (snapshotBalance != 0) {
			total = snapshotBalance;
		}
		x.forEach((element) => {
			total += element.quantity * element.market.price;
		});
		return total;
	}
	$effect(() => {
		const marketSubscription = supabase
			.channel('market_prices')
			.on(
				'postgres_changes',
				{
					event: 'INSERT',
					schema: 'public',
					table: 'market_prices'
				},
				(payload: any) => {
					// console.log('postgres_changes event triggered', payload);
					const { new: newData, old: oldData } = payload;
					if (newData.stock_id !== marketData?.id && oldData.stock_id !== marketData?.id) {
						return;
					}
					if (payload.eventType === 'INSERT') {
						marketData = {
							...marketData,
							history: [...marketData.history, newData]
						};
					}
				}
			)
			.subscribe();

		const profileSubscription = data.session
			? supabase
					.channel('profiles')
					.on(
						'postgres_changes',
						{
							event: 'UPDATE',
							schema: 'public',
							table: 'profiles',
							filter: `id=eq.${data.session.user.id}`
						},
						(payload: any) => {
							const { new: newData } = payload;
							userBalance = newData.balance;
						}
					)
					.subscribe()
			: null;
		// const marketBalanceSubscription = data.session
		// 	? supabase
		// 			.channel('individual_market_price')
		// 			.on(
		// 				'postgres_changes',
		// 				{
		// 					event: 'UPDATE',
		// 					schema: 'public',
		// 					table: 'market',
		// 					filter: `id=eq.${marketData?.id}`
		// 				},
		// 				(payload: any) => {
		// 					const { new: newData } = payload;
		// 					currentPrice = newData.price;
		// 					console.log(currentPrice)
		// 				}
		// 			)
		// 			.subscribe()
		// 	: null;

		const inventorySubscription = data.session
			? supabase
					.channel('inventory')
					.on(
						'postgres_changes',
						{
							event: 'UPDATE',
							schema: 'public',
							table: 'inventory',
							filter: `user_id=eq.${data.session.user.id}`
						},
						(payload: any) => {
							const { new: newData } = payload;
							userSharesAmount = newData.quantity;
						}
					)
					.subscribe()
			: null;

		return () => {
			marketSubscription.unsubscribe();
			profileSubscription?.unsubscribe();
			// marketBalanceSubscription?.unsubscribe();
			inventorySubscription?.unsubscribe();
		};
	});

	function getFilteredHistory(item: MarketItem, dateRange: string): MarketItemHistory[] {
		const currentTimestamp = Math.floor(Date.now() / 1000); // Convert to seconds
		let filterTimestamp = 0;
		let filteredHistory = item.history;
		const timestamps = new Set();

		switch (dateRange) {
			case 'hour':
				filterTimestamp = currentTimestamp - 60 * 60; // 1 hour in seconds
				filteredHistory = item.history.filter((entry) => {
					const roundedTimestamp = Math.floor(entry.timestamp/10);
					if (timestamps.has(roundedTimestamp)) {
						return false;
					}
					timestamps.add(roundedTimestamp);
					return (
						entry.timestamp >= filterTimestamp &&
						roundedTimestamp % (1*6) === 0
					);
				});
				break;
			case 'day':
				filterTimestamp = currentTimestamp - 24 * 60 * 60; // 24 hours in seconds
				filteredHistory = item.history.filter((entry) => {
					const roundedTimestamp = Math.floor(entry.timestamp/10);
					if (timestamps.has(roundedTimestamp)) {
						return false;
					}
					timestamps.add(roundedTimestamp);
					return (
						entry.timestamp >= filterTimestamp &&
						roundedTimestamp % (15*6) === 0
					);
				});
				break;
			case 'week':
				filterTimestamp = currentTimestamp - 7 * 24 * 60 * 60; // 7 days in seconds
				filteredHistory = item.history.filter((entry) => {
					const roundedTimestamp = Math.floor(entry.timestamp/10);
					if (timestamps.has(roundedTimestamp)) {
						return false;
					}
					timestamps.add(roundedTimestamp);
					return (
						entry.timestamp >= filterTimestamp &&
						roundedTimestamp % (60*6) === 0
					);
				});
				break;
			case 'month':
				filterTimestamp = currentTimestamp - 30 * 24 * 60 * 60; // 7 days in seconds
				filteredHistory = item.history.filter((entry) => {
					const roundedTimestamp = Math.floor(entry.timestamp/10);
					if (timestamps.has(roundedTimestamp)) {
						return false;
					}
					timestamps.add(roundedTimestamp);
					return (
						entry.timestamp >= filterTimestamp &&
						roundedTimestamp % (60*24*6) === 0
					);
				});
				break;
			default:
				return item.history;
		}

		// If the filtered history is empty, include the most recent data point
		if (filteredHistory.length === 0 && item.history.length > 0) {
			return [item.history[item.history.length - 1]];
		}

		return filteredHistory;
	}

	const filteredMarketHistory = $derived(getFilteredHistory(marketData, selectedDateRange));
	let currentPrice = $derived(marketData?.history?.slice(-1)[0]?.price || 0);
	// let currentPrice = $derived(marketData?.price || 0); // we are using this because the latest timestamp price isnt the real price due to script not updating
	let beginningPrice = $derived(filteredMarketHistory[0]?.price || 0);
	let percentageChange = $derived(((currentPrice - beginningPrice) / beginningPrice) * 100);
	let filteredmarketData = $derived({
		...marketData,
		history: filteredMarketHistory,
		beginningPrice: beginningPrice,
		currentPrice: currentPrice
	});
</script>

<svelte:head>
	<title>${marketData?.ticker} - {marketData?.name}</title>
</svelte:head>

{#if filteredmarketData && filteredmarketData.history}
	<div class="bg-gray2 text-white min-h-screen font-inter">
		<div class="container mx-auto">
			<div class="flex flex-col md:flex-row space-x-0 md:space-x-4">
				<div class="bg-gray rounded-lg pt-6 md:px-4 w-full md:flex-1">
					<div class="flex justify-between items-center mb-4">
						<div>
							<div class="text-2xl">
								${Number(filteredmarketData.currentPrice).toLocaleString(undefined, {
									minimumFractionDigits: 2,
									maximumFractionDigits: 2
								})}
							</div>
							<div
								class={`text-lg ${
									filteredmarketData.currentPrice > filteredmarketData.beginningPrice
										? 'text-green-500'
										: filteredmarketData.currentPrice < filteredmarketData.beginningPrice
											? 'text-red-500'
											: 'text-gray-500'
								}`}
							>
								{((filteredmarketData.currentPrice - filteredmarketData.beginningPrice) /
									filteredmarketData.beginningPrice) *
									100 !==
								0
									? ((filteredmarketData.currentPrice - filteredmarketData.beginningPrice) /
											filteredmarketData.beginningPrice) *
											100 >
										0
										? '+'
										: ''
									: ''}
								{percentageChange.toFixed(2)}%
							</div>
						</div>
						<div>
							<button
								class={`px-2 py-2 rounded-lg ${
									selectedDateRange === 'hour' ? 'text-white' : 'text-gray-500'
								}`}
								onclick={() => (selectedDateRange = 'hour')}
							>
								1H
							</button>
							<button
								class={`px-2 py-2 rounded-lg ${
									selectedDateRange === 'day' ? 'text-white' : 'text-gray-500'
								}`}
								onclick={() => (selectedDateRange = 'day')}
							>
								1D
							</button>
							<button
								class={`px-2 py-2 rounded-lg ${
									selectedDateRange === 'week' ? 'text-white' : 'text-gray-500'
								}`}
								onclick={() => (selectedDateRange = 'week')}
							>
								1W
							</button>
							<button
								class={`px-2 py-2 rounded-lg ${
									selectedDateRange === 'month' ? 'text-white' : 'text-gray-500'
								}`}
								onclick={() => (selectedDateRange = 'month')}
							>
								1M
							</button>
						</div>
					</div>
					<Chart stockData={filteredmarketData.history} />
				</div>
				<div class="flex-col">
					{#if data.session && userBalance !== null}
						{@render buyAndSell({
							marketData,
							currentPrice,
							ticker,
							filteredmarketData,
							userBalance: data.session && userBalance !== null ? userBalance : null,
							userSharesAmount: data.session && userSharesAmount !== null ? userSharesAmount : null,
							signedIn: data.session && userBalance !== null
						})}
					{/if}
					{#if data.session && userBalance !== null && inventoryData != null}
						<Portfolio balance={userBalance} netWorth={calcNW(inventoryData)} />
					{/if}
				</div>
			</div>
			<Comments {comments} currentId={marketData.id} />
		</div>
	</div>
{/if}

{#snippet buyAndSell(props)}
	<div class="w-full md:w-[350px]">
		<BuyandSell
			stockID={Number(props.marketData?.id)}
			currentPrice={Number(props.currentPrice)}
			userBalance={props.userBalance}
			userSharesAmount={props.userSharesAmount}
			ticker={props.ticker}
			name={props.filteredmarketData.name}
			signedIn={props.signedIn}
		/>
	</div>
{/snippet}