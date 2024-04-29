<script lang="ts">
	import { toast } from 'svelte-sonner';
	import { Tabs } from 'bits-ui';
	import type { Prediction } from '$lib/types';

	let { prediction, userBalance }: { prediction: Prediction; userBalance: number } = $props();

	let amount = $state('');
	let loading = $state(false);
	let timeLeft = $state('0:46'); // Placeholder for time left until submissions close.

	let selectedOptionId = $state();

	async function placeBet() {
		if (!selectedOptionId) {
			toast.error('Please select an option before placing a bet.');
			return;
		}

		const betAmount = parseFloat(amount);
		if (isNaN(betAmount) || betAmount <= 0) {
			toast.error('Please enter a valid bet amount.');
			return;
		}

		if (betAmount > userBalance) {
			toast.error('Bet amount exceeds your balance.');
			return;
		}

		loading = true;
		try {
			const response = await fetch(`/api/predict`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					predictionId: prediction.id,
					optionId: selectedOptionId,
					betAmount
				})
			});

			if (!response.ok) {
				throw new Error('Failed to place bet.');
			} else {
				const resp = await response.json();
				if (resp.success) {
					toast.success(`Your bet of ${betAmount} on option was successfully placed.`);
				} else {
					toast.error(resp.error || 'An error occurred while placing your bet.');
				}
			}
		} catch (error) {
			toast.error('An error occurred while placing your bet.');
		} finally {
			loading = false;
		}
	}

	function selectOption(optionId: null) {
		selectedOptionId = optionId;
	}

	function handleCustomBetInput(event: { target: { value: any } }) {
		const { value } = event.target;
		amount = value.replace(/[^\d.]/g, '');
		if (parseFloat(amount) > userBalance) {
			toast.error('Bet amount exceeds your balance.');
			amount = userBalance.toString();
		}
	}
</script>

<div
	class="prediction-component w-1/3 p-4 font-inter border border-lightgray m-4 rounded-[9px] text-white"
>
	<div class="header mb-4 flex justify-between items-center">
		<h2 class="text-lg font-semibold">{prediction.description}</h2>
		<span class="text-sm">Submissions closing in {timeLeft}</span>
	</div>

	<Tabs.Root class="border-t border-b border-lightgray">
		<Tabs.List class="flex justify-center">
			{#each prediction.options as option (option.id)}
				<Tabs.Trigger
					value={option.id}
					on:click={() => selectOption(option.id)}
					class={selectedOptionId === option.id
						? 'tab-button mx-1 py-2 px-4 rounded-lg text-sm font-semibold text-blue-500 '
						: 'tab-button mx-1 py-2 px-4 rounded-lg text-sm font-semibold '}
				>
					{option.description}
				</Tabs.Trigger>
			{/each}
		</Tabs.List>
	</Tabs.Root>

	<div class="custom-bet-input mt-4">
		<input
			class="w-full bg-gray-800 border border-gray-600 rounded-md py-2 px-3 focus:outline-none focus:ring focus:ring-blue-500"
			type="text"
			placeholder="Enter Amount"
			on:input={handleCustomBetInput}
			value={amount}
		/>
		<div class="flex justify-between mt-2">
			<button
				class="w-1/4 inline-flex items-center justify-center p-0.5 overflow-hidden text-xs text-white bg-lightgray hover:bg-gray-700 border-r border-gray-600 rounded-l-md"
				onclick={() => {
					if (userBalance) {
						amount = (userBalance * 0.25).toLocaleString(undefined, {
							minimumFractionDigits: 0,
							maximumFractionDigits: 2
						});
					}
				}}
			>
				<span class="relative px-2 py-1 transition-all ease-in duration-75 group-hover:bg-opacity-0"
					>25%</span
				>
			</button>
			<button
				class="w-1/4 inline-flex items-center justify-center p-0.5 overflow-hidden text-xs text-white bg-lightgray hover:bg-gray-700 border-r border-gray-600"
				onclick={() => {
					if (userBalance) {
						amount = (userBalance * 0.5).toLocaleString(undefined, {
							minimumFractionDigits: 0,
							maximumFractionDigits: 2
						});
					}
				}}
			>
				<span class="relative px-2 py-1 transition-all ease-in duration-75 group-hover:bg-opacity-0"
					>50%</span
				>
			</button>
			<button
				class="w-1/4 inline-flex items-center justify-center p-0.5 overflow-hidden text-xs text-white bg-lightgray hover:bg-gray-700 border-r border-gray-600"
				onclick={() => {
					if (userBalance) {
						amount = (userBalance * 0.75).toLocaleString(undefined, {
							minimumFractionDigits: 0,
							maximumFractionDigits: 2
						});
					}
				}}
			>
				<span class="relative px-2 py-1 transition-all ease-in duration-75 group-hover:bg-opacity-0"
					>75%</span
				>
			</button>
			<button
				class="w-1/4 inline-flex items-center justify-center p-0.5 overflow-hidden text-xs text-white bg-lightgray hover:bg-gray-700 border-gray-600 rounded-r-md"
				onclick={() => {
					if (userBalance) {
						amount = userBalance.toLocaleString(undefined, {
							minimumFractionDigits: 0,
							maximumFractionDigits: 2
						});
					}
				}}
			>
				<span class="relative px-2 py-1 transition-all ease-in duration-75 group-hover:bg-opacity-0"
					>Max</span
				>
			</button>
		</div>
	</div>

	<button
		class="place-bet-button w-full mt-4 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 rounded-lg py-2"
		on:click={placeBet}
		disabled={!amount || !selectedOptionId || loading}
	>
		{#if loading}
			Placing bet...
		{:else}
			Place Bet
		{/if}
	</button>
</div>

<style>
	.selected {
		background-color: var(--color-primary); /* Replace with your actual primary color variable */
		color: white;
	}
</style>
