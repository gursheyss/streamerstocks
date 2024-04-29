<script lang="ts">
	import { page } from '$app/stores';
	import PredictionComponent from '$lib/components/Prediction.svelte';
	import type { Prediction, Bet } from '$lib/types';

	let { data } = $props();
	let predictions: Prediction[] = $state(data.predictions ?? []);
	let userBalance = $state<number | null>(data.userBalance ?? null);
	let userBets: Bet[] = $state(data.userBets ?? []);

	function handleBetPlacement(predictionId: number, amount: number) {
		console.log(`Placing a bet of ${amount} on prediction ${predictionId}`);
	}
</script>

<svelte:head>
	<title>Predictions</title>
</svelte:head>
<div>
	<div class="predictions-page flex flex-row">
		{#each predictions as prediction}
			<PredictionComponent {prediction} {userBalance} {userBets} onPlaceBet={handleBetPlacement} />
		{/each}
	</div>
</div>
