<script lang="ts">
	import { page } from '$app/stores';
	import Chart from '$lib/components/Chart.svelte';
	import Comments from '$lib/components/Comments.svelte';
	import type { MarketItem } from '$lib/types';
	import { onMount } from 'svelte';
	import type { Comment } from '$lib/types';

	let { data } = $props();
	let { ticker } = $derived($page.params);
	let { supabase } = $derived(data);

	let marketData: MarketItem[] = $state([]);
	let comments: Comment[] = $state([]);

	async function fetchComments() {
		console.log('testing');
		const { data: commentsData, error: commentsError } = await supabase
			.from('comments')
			.select(
				`
    id,
    comment,
    user_id,
    profiles!comments_user_id_fkey (
        avatar_url,
        username
    )
`
			)
			.eq('stock_id', marketData[0].id)
			.order('id', { ascending: false });

		if (commentsError) {
			console.error('Error fetching comments:', commentsError);
		} else {
			const newComments = commentsData.map((comment) => ({
				id: comment.id,
				avatar_url: comment.profiles?.avatar_url || null,
				username: comment.profiles?.username || null,
				comment: comment.comment
			}));

			// Update existing comments
			comments = comments.map((c) => newComments.find((nc) => nc.id === c.id) || c);

			// Add new comments
			const newCommentsToAdd = newComments.filter((nc) => !comments.find((c) => c.id === nc.id));
			comments = [...comments, ...newCommentsToAdd];
		}
	}

	onMount(async () => {
		let { data: initialData, error } = await supabase
			.from('market')
			.select('*')
			.ilike('ticker', ticker);

		if (error) {
			console.error('Error fetching initial data:', error);
		} else {
			marketData = initialData as MarketItem[];
			await fetchComments();
		}
	});

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
						const newComment = {
							id: newData.id,
							avatar_url: newData.profiles?.avatar_url || null,
							username: newData.profiles?.username || null,
							comment: newData.comment,
							score: newData.score
						};
						comments = [...comments, newComment];
					} else if (payload.eventType === 'UPDATE') {
						comments = comments.map((comment) =>
							comment.id === newData.id
								? {
										...comment,
										comment: newData.comment,
										score: newData.score,
										avatar_url: newData.profiles?.avatar_url || comment.avatar_url,
										username: newData.profiles?.username || comment.username
									}
								: comment
						);
					} else if (payload.eventType === 'DELETE') {
						comments = comments.filter((comment) => comment.id !== oldData.id);
					}
				}
			)
			.subscribe();

		return () => {
			marketSubscription.unsubscribe();
			commentsSubscription.unsubscribe();
		};
	});
</script>

{#if marketData[0] && marketData[0].history}
	<div class="bg-gray2 text-white min-h-screen font-inter">
		<div class="container mx-auto px-4 pt-8">
			<h1 class="text-4xl font-bold">
				{marketData[0].name}
				<span class="text-gray-500">${ticker.toUpperCase()}</span>
			</h1>
			<div class="bg-gray rounded-lg shadow-lg p-6 mb-8 w-full">
				<Chart stockData={marketData[0].history} />
			</div>
			<Comments {comments} />
		</div>
	</div>
{/if}
