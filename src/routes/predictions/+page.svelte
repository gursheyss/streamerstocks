<script lang="ts">
	import { page } from '$app/stores';
	import PredictionComponent from '$lib/components/Prediction.svelte';
	import type { Prediction } from '$lib/types';

	let { data } = $props();
	let predictions: Prediction[] = $state(data.predictions);
	let userBalance = $state<number | null>(data.userBalance);

	// Derived or computed values should be handled within $effect or getters
	$effect(() => {
		// Here you might want to set up any derived state or effects that react to changes in your state.
	});

	// Example effect to react to changes in user balance
	$effect(() => {
		if (userBalance !== null) {
			console.log(`User balance updated: ${userBalance}`);
			// Possibly update user's available funds for betting
		}
	});

	// Define any additional handlers or logic here
	function handleBetPlacement(predictionId: number, amount: number) {
		// Logic to handle bet placement
		console.log(`Placing a bet of ${amount} on prediction ${predictionId}`);
	}
</script>

<svelte:head>
	<title>Predictions</title>
</svelte:head>
<div>
	<div class="predictions-page flex flex-row">
		{#each predictions as prediction}
			<PredictionComponent {prediction} {userBalance} onPlaceBet={handleBetPlacement} />
		{/each}
	</div>
</div>
