<script lang="ts">
	import { onMount } from 'svelte';
	import PredictionComponent from '$lib/components/Prediction.svelte';
	import type { Prediction, Bet } from '$lib/types';

	let { data } = $props();
	let userBalance = $state<number | null>(data.userBalance ?? null);
	let userBets: Bet[] = $state(data.userBets ?? []);
	let groupedPredictions = $state({
		ONGOING: [],
		PENDING: [],
		COMPLETED: []
	});

	onMount(() => {
		groupPredictions();
	});

	function groupPredictions() {
		data.predictions?.forEach((prediction) => {
			if (prediction.status === 'ONGOING') {
				groupedPredictions.ONGOING.push(prediction);
			} else if (prediction.status === 'PENDING') {
				groupedPredictions.PENDING.push(prediction);
			} else if (prediction.status === 'COMPLETED') {
				groupedPredictions.COMPLETED.push(prediction);
			}
		});
	}

	function handleBetPlacement(predictionId: number, amount: number) {
		console.log(`Placing a bet of ${amount} on prediction ${predictionId}`);
	}
</script>

<svelte:head>
	<title>Predictions</title>
</svelte:head>

<div class="predictions-page">
	<h2 class="mt-8 mb-4 text-lg font-bold">Open Predictions</h2>
	<div class="grid-container overflow-x-auto border-b border-lightgray rounded-md">
		<div class="flex overflow-x-auto pb-4">
			{#each groupedPredictions.ONGOING as prediction}
				<PredictionComponent
					{prediction}
					{userBalance}
					{userBets}
					onPlaceBet={handleBetPlacement}
				/>
			{/each}
		</div>
	</div>

	<h2 class="mt-8 mb-4 text-lg font-bold">Pending</h2>
	<div class="grid-container overflow-x-auto border-b border-lightgray rounded-md">
		<div class="flex overflow-x-auto pb-4">
			{#each groupedPredictions.PENDING as prediction}
				<PredictionComponent
					{prediction}
					{userBalance}
					{userBets}
					onPlaceBet={handleBetPlacement}
				/>
			{/each}
		</div>
	</div>

	<h2 class="mt-8 mb-4 text-lg font-bold">Completed</h2>
	<div class="grid-container overflow-x-auto border-b border-lightgray rounded-md">
		<div class="flex overflow-x-auto pb-4">
			{#each groupedPredictions.COMPLETED as prediction}
				<PredictionComponent
					{prediction}
					{userBalance}
					{userBets}
					onPlaceBet={handleBetPlacement}
				/>
			{/each}
		</div>
	</div>
</div>
