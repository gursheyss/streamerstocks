<script lang="ts">
	import { enhance } from '$app/forms';
	import { onMount } from 'svelte';

	let { data } = $props();
	let supabase = $derived(data.supabase);
	let uuid: string = '';
	if (data != null && data.session != null) {
		uuid = data.session.user.id;
	}
	let placeHolderID: number = 28;
	let bal = $state(-69);
	async function signInWithTwitch() {
		await supabase.auth.signInWithOAuth({
			provider: 'twitch',
			options: {
				redirectTo: 'http://localhost:5173/auth/callback'
			}
		});
	}

	async function updateStockAndBal(amt: number, stockID: number) {
		//ERRORS NEED TO BE HANDLED FOR PROD, ALSO THIS CODE IS ASSUMING WE ARE LOGGED IN
		let { data, error } = await supabase
  		.from('market')
  		.select()
		.eq('id', stockID);
		if(error) console.error(error)
		console.log(data);
		
		if (data != null) {
			let price = data[0]["price"];
			if (bal >= (price * amt) || amt > 0) {
				console.log({
					amt: (price*amt).toFixed(2), 
					userid: uuid
				})
				let { data: userData, error: userError } = await supabase
				.rpc('update_user_bal', {
					amt: (price*amt).toFixed(2), 
					userid: uuid
				})
				if (userError) console.error(userError)
				else console.log("user updating" + userData)

				//needs to add/remove stock from porfolio

				let { data: stockData, error: stockError } = await supabase
				.rpc('update_stock', {
					amt: amt, 
					stockid: stockID
				})
				if (stockError) console.error(stockError)
				else console.log("stock updating:" + stockData)
				//update local bal
				let { data: balanceData, error: balanceError } = await supabase
				.rpc('get_user_bal', {
					userid: uuid
				})
				if (error) {
					console.error('Error fetching initial balance data:', balanceError);
				}
				else {
					bal = balanceData;
				}
			}
		}
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
	onMount(async () => {
		let { data, error } = await supabase
		.rpc('get_user_bal', {
			userid: uuid
		})
		if (error) {
			console.error('Error fetching initial balance data:', error);
		}
		else {
			bal = data;
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


<button id="SignInButton" on:click={signInWithTwitch}>Sign in with Twitch</button>
<!-- PLACEHOLDER VALUES FOR NOW -->
<button id="BuyButton" on:click={() => updateStockAndBal(-3, placeHolderID)}>Buy</button>
<button id="SellButton" on:click={() => updateStockAndBal(3, placeHolderID)}>Sell</button>

<form action="?/signOut" method="POST" use:enhance>
	<button id="SignOutButton" type="submit">Sign out</button>
</form>

<img src={data.session?.user.user_metadata.avatar_url} alt="avatar" />
<div>bal: ${bal}</div>
<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
	{#each marketData as item}
		<div class="bg-white shadow-md rounded-lg p-4">
			<div class="flex items-center mb-4">
				{#if item.image}
					<img src={item.image} alt={item.name} class="w-10 h-10 rounded-full mr-4" />
				{:else}
					<div class="w-10 h-10 bg-gray-300 rounded-full mr-4"></div>
				{/if}
				<div>
					<h2 class="text-lg font-semibold">{item.name}</h2>
					<p class="text-gray-500">${item.ticker}</p>
				</div>
			</div>
			<div class="flex justify-between items-center">
				<p class="text-2xl font-bold">${item.price}</p>
				<div>
					{#if item.low}
						<p class="text-gray-500">Low: ${item.low}</p>
					{/if}
					{#if item.high}
						<p class="text-gray-500">High: ${item.high}</p>
					{/if}
				</div>
			</div>
			{#if item.market_cap}
				<p class="text-gray-500 mt-2">Market Cap: ${item.market_cap}</p>
			{/if}
			{#if item.volume}
				<p class="text-gray-500 mt-1">Market Volume: ${item.volume}</p>
			{/if}
		</div>
	{/each}
</div>
