<script lang="ts">
	import { page } from '$app/stores';
	import Chart from '$lib/components/Chart.svelte';
	import Comments from '$lib/components/Comments.svelte';
	import BuyandSell from '$lib/components/BuyandSell.svelte'
	import Portfolio from '$lib/components/Portfolio.svelte';
	import type { MarketItem } from '$lib/types';
	import type { Comment } from '$lib/types';

	let { data } = $props();
	let { ticker } = $derived($page.params);
	let { supabase } = $derived(data);

	let marketData: MarketItem[] = $state(data.marketData);
	let comments: Comment[] = $state(data.comments);
	let userBalance = $state<number | null>(data.userBalance);
	let netWorth = $state<number | null>(data.netWorth);

	let currentPrice = $derived(marketData[0]?.history?.slice(-1)[0]?.price || 0);
	let beginningPrice = $derived(marketData[0]?.history?.[0]?.price || 0);
	let percentageChange = $derived(((currentPrice - beginningPrice) / beginningPrice) * 100);

	$effect(() => {
		const marketSubscription = supabase
			.channel('market')
			.on(
				'postgres_changes',
				{
					event: '*',
					schema: 'public',
					table: 'market'
				},
				(payload: any) => {
					const { new: newData, old: oldData } = payload;
					if (newData.ticker !== ticker && oldData.ticker !== ticker) {
						return;
					}
					if (payload.eventType === 'INSERT') {
						marketData = [...marketData, newData as MarketItem];
					} else if (payload.eventType === 'UPDATE') {
						marketData = marketData.map((item) =>
							item.id === newData.id ? (newData as MarketItem) : item
						);
					} else if (payload.eventType === 'DELETE') {
						marketData = marketData.filter((item) => item.id !== oldData.id);
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
					table: 'comments'
				},
				async (payload: any) => {
					console.log('postgres_changes event triggered', payload);
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

		return () => {
			marketSubscription.unsubscribe();
			commentsSubscription.unsubscribe();
			profileSubscription?.unsubscribe();
		};
	});
</script>

<svelte:head>
	<title>${marketData[0]?.ticker} - {marketData[0]?.name}</title>
</svelte:head>

{#if marketData[0] && marketData[0].history}
	<div class="bg-gray2 text-white min-h-screen font-inter">
		<div class="container mx-auto px-4 pt-8">
			<div class="flex justify-between items-center">
				<h1 class="text-4xl font-bold">
					{marketData[0].name}
					<span class="text-gray-500">${ticker.toUpperCase()}</span>
				</h1>
				<div class="text-2xl">
					${currentPrice.toFixed(2)}
					<span
						class={percentageChange > 0
							? 'text-green-500'
							: percentageChange < 0
								? 'text-red-500'
								: 'text-gray-500'}
					>
						({percentageChange !== 0
							? percentageChange > 0
								? '+'
								: ''
							: ''}{percentageChange.toFixed(2)}%)
					</span>
				</div>
			</div>
			<div class="bg-gray rounded-lg shadow-lg p-6 mb-8 w-full">
				<Chart stockData={marketData[0].history} />
			</div>
			{#if data.session && userBalance !== null && netWorth != null}
				<Portfolio balance={userBalance} {netWorth}/>
			{/if}
			{#if data.session && userBalance !== null}
				<BuyandSell uuid = {data.session.user.id} stockID = {Number(marketData[0].id)} currentPrice = {Number(currentPrice)} userBalance = {userBalance}, ticker = {ticker}/>
			{/if}
			<Comments {comments} currentId={marketData[0].id} />
		</div>
	</div>
{/if}
