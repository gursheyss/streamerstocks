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
	let selectedDateRange = $state('1 hour');

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

		const commentsSubscription = supabase
			.channel('comments')
			.on(
				'postgres_changes',
				{
					event: '*',
					schema: 'public',
					table: 'comments',
					filter: `stock_id=eq.${marketData?.id}`
				},
				async (payload: any) => {
					// console.log('postgres_changes event triggered', payload);
					const { new: newData, old: oldData } = payload;
					if (payload.eventType === 'INSERT') {
						let newComment = {
							id: newData.id,
							avatar_url: newData.profiles?.avatar_url || null,
							username: newData.profiles?.username || null,
							comment: newData.comment,
							created_at: newData.created_at
						};

						if (!newData.profiles) {
							const { data: userProfile, error } = await supabase
								.from('profiles')
								.select('username, avatar_url')
								.eq('id', newData.user_id)
								.single();

							if (error) {
								console.error('Error fetching user profile:', error);
							} else {
								newComment.avatar_url = userProfile.avatar_url;
								newComment.username = userProfile.username;
							}
						}

						comments = [newComment, ...comments];
					} else if (payload.eventType === 'UPDATE') {
						comments = comments.map((comment) =>
							comment.id === newData.id
								? {
										...comment,
										comment: newData.comment,
										score: newData.score,
										avatar_url: newData.profiles?.avatar_url || comment.avatar_url,
										username: newData.profiles?.username || comment.username,
										created_at: newData.created_at
									}
								: comment
						);
					} else if (payload.eventType === 'DELETE') {
						comments = comments.filter((comment) => comment.id !== oldData.id);
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

		return () => {
			marketSubscription.unsubscribe();
			commentsSubscription.unsubscribe();
			profileSubscription?.unsubscribe();
			// marketBalanceSubscription?.unsubscribe();
		};
	});

	function getFilteredHistory(item: MarketItem, dateRange: string): MarketItemHistory[] {
		const currentTimestamp = Math.floor(Date.now() / 1000); // Convert to seconds
		let filterTimestamp = 0;

		switch (dateRange) {
			case '1 hour':
				filterTimestamp = currentTimestamp - 60 * 60; // 1 hour in seconds
				break;
			case '12 hour':
				filterTimestamp = currentTimestamp - 12 * 60 * 60; // 12 hours in seconds
				break;
			case '24 hour':
				filterTimestamp = currentTimestamp - 24 * 60 * 60; // 24 hours in seconds
				break;
			// case '7 days':
			// 	filterTimestamp = currentTimestamp - 7 * 24 * 60 * 60; // 7 days in seconds
			// 	break;
			default:
				return item.history;
		}

		const filteredHistory = item.history.filter((entry) => entry.timestamp >= filterTimestamp);

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
									selectedDateRange === '1 hour' ? 'text-white' : 'text-gray-500'
								}`}
								onclick={() => (selectedDateRange = '1 hour')}
							>
								1H
							</button>
							<button
								class={` px-2 py-2 rounded-lg ${
									selectedDateRange === '12 hour' ? 'text-white' : 'text-gray-500'
								}`}
								onclick={() => (selectedDateRange = '12 hour')}
							>
								12H
							</button>
							<button
								class={`px-2 py-2 rounded-lg ${
									selectedDateRange === '24 hour' ? 'text-white' : 'text-gray-500'
								}`}
								onclick={() => (selectedDateRange = '24 hour')}
							>
								24H
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
