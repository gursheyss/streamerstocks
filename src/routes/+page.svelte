<script lang="ts">
	import { onMount } from 'svelte';
	import Table from '$lib/components/Table.svelte';
	import type { MarketItem, News as NewsType } from '$lib/types.js';
	import Portfolio from '$lib/components/Portfolio.svelte';
	import News from '$lib/components/News.svelte';

	let { data } = $props();
	let supabase = $derived(data.supabase);
	let uuid: string = '';
	if (data != null && data.session != null) {
		uuid = data.session.user.id;
	}
	let placeHolderID: number = 28;

	async function updateStockAndBal(uuid: string, amt: number, stockID: number) {
		const response = await fetch('/request_api', {
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
		console.log('server' + response);
	}

	let marketData = $state<MarketItem[]>([]);
	let userBalance = $state<number | null>(null);
	let news = $state<NewsType[]>([]);
	onMount(async () => {
		let { data: initialData, error } = await supabase
			.from('market')
			.select('*')
			.order('price', { ascending: false });
		if (error) {
			console.error('Error fetching initial data:', error);
		} else {
			marketData = initialData as MarketItem[];
		}

		let { data: newsData, error: newsError } = await supabase
			.from('news')
			.select('*')
			.order('id', { ascending: false });
		if (newsError) {
			console.error('Error fetching news:', newsError);
		} else {
			console.log(newsData);
			news = newsData as NewsType[];
		}

		// Fetch user balance only if data.session exists
		if (data.session) {
			let { data: profileData, error: profileError } = await supabase
				.from('profiles')
				.select('balance')
				.eq('id', data.session.user.id)
				.single();

			if (profileError) {
				console.error('Error fetching user balance:', profileError);
			} else {
				userBalance = profileData?.balance ?? null;
			}
		}
	});

	$effect(() => {
		const marketSubscription = supabase
			.channel('market')
			.on('postgres_changes', { event: '*', schema: 'public', table: 'market' }, (payload: any) => {
				const { new: newData, old: oldData } = payload;
				if (payload.eventType === 'INSERT') {
					// New record inserted
					marketData = [...marketData, newData as MarketItem];
				} else if (payload.eventType === 'UPDATE') {
					// Record updated
					marketData = marketData.map((item) =>
						item.id === newData.id ? (newData as MarketItem) : item
					);
				} else if (payload.eventType === 'DELETE') {
					// Record deleted
					marketData = marketData.filter((item) => item.id !== oldData.id);
				}
			})
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

		const newsSubscription = data.session
			? supabase
					.channel('news')
					.on(
						'postgres_changes',
						{ event: '*', schema: 'public', table: 'news' },
						(payload: any) => {
							const { new: newData, old: oldData } = payload;
							if (payload.eventType === 'INSERT') {
								console.log('newData', newData);
								news = [...news, newData as NewsType];
							} else if (payload.eventType === 'UPDATE') {
								news = news.map((item) => (item.id === newData.id ? (newData as NewsType) : item));
							} else if (payload.eventType === 'DELETE') {
								news = news.filter((item) => item.id !== oldData.id);
							}
						}
					)
					.subscribe()
			: null;

		return () => {
			newsSubscription?.unsubscribe();
			marketSubscription.unsubscribe();
			profileSubscription?.unsubscribe();
		};
	});
</script>

{#if data.session && userBalance !== null}
	<Portfolio balance={userBalance} />
{/if}

<div class="flex flex-col space-y-4">
	<News {news} />
	<Table {marketData} />
</div>

<!-- PLACEHOLDER VALUES FOR NOW
<button id="BuyButton" on:click={() => updateStockAndBal(uuid, -1, placeHolderID)}
	>Buy</button
>
<button id="SellButton" on:click={() => updateStockAndBal(uuid, 1, placeHolderID)}
	>Sell</button
> -->
