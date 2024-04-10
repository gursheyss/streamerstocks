<script lang="ts">
	import { enhance } from '$app/forms';
	import { onMount } from 'svelte';

	let { data } = $props();
	let supabase = $derived(data.supabase);

	async function signInWithTwitch() {
		await supabase.auth.signInWithOAuth({
			provider: 'twitch',
			options: {
				redirectTo: 'http://localhost:5173/auth/callback'
			}
		});
	}

	interface MarketItem {
		id: string;
		name: string;
		ticker: string;
		price: number;
		low: number;
		high: number;
		market_cap: number;
		volume: number;
		image: string;
	}

	let marketData = $state<MarketItem[]>([]);

	onMount(async () => {
		let { data: initialData, error } = await supabase.from('market').select('*');
		if (error) {
			console.error('Error fetching initial data:', error);
		} else {
			marketData = initialData as MarketItem[];
		}
	});

	$effect(() => {
		const subscription = supabase
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

		return () => {
			subscription.unsubscribe();
		};
	});
</script>

<button on:click={signInWithTwitch}>Sign in with Twitch</button>

<form action="?/signOut" method="POST" use:enhance>
	<button type="submit">Sign out</button>
</form>

<img src={data.session?.user.user_metadata.avatar_url} alt="avatar" />

{JSON.stringify(marketData)}
