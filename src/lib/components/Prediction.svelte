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

			if (response.ok) {
				const resp = await response.json();
				toast.success(`Your bet of ${betAmount} on option was successfully placed.`);
			} else {
				const errorData = await response.json();
				// Here we handle different status codes
				switch (response.status) {
					case 401:
						toast.error('Unauthorized: Please log in to perform this action.');
						break;
					case 429:
						toast.error(errorData.message);
						break;
					case 400:
						toast.error(errorData.message);
						break;
					case 500:
						toast.error(errorData.message || 'An unexpected error occurred.');
						break;
					default:
						toast.error('An unexpected error occurred.');
				}
			}
		} catch (error) {
			console.error('Error:', error);
			toast.error('An unexpected error occurred. Please try again later.');
		} finally {
			loading = false;
		}
	}

	function selectOption(optionId: null) {
		selectedOptionId = optionId;
	}

	function setAmountPercentage(percentage: number) {
		if (userBalance) {
			const calculatedAmount = userBalance * percentage;
			amount = calculatedAmount.toFixed(2);
		}
	}

	function handleInput(event: Event & { currentTarget: EventTarget & HTMLInputElement }) {
		let inputElement = event.currentTarget;
		let inputValue = inputElement.value.replace(/[^\d.]/g, '');
		let decimalIndex = inputValue.indexOf('.');
		if (decimalIndex !== -1) {
			inputValue = inputValue.slice(0, decimalIndex + 4);
		}
		amount = String(inputValue);
		if (Number(amount) > userBalance) {
			amount = userBalance.toFixed(2);
		} else if (inputValue === '') {
			amount = '';
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
					onclick={() => selectOption(option.id)}
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
			bind:value={amount}
			placeholder="Enter Amount"
			oninput={handleInput}
		/>
		<div class="flex justify-between mt-2">
			<button
				class="w-1/4 inline-flex items-center justify-center p-0.5 overflow-hidden text-xs text-white bg-lightgray hover:bg-gray-700 border-r border-gray-600 rounded-l-md"
				onclick={() => setAmountPercentage(0.25)}
			>
				<span class="relative px-2 py-1 transition-all ease-in duration-75 group-hover:bg-opacity-0"
					>25%</span
				>
			</button>
			<button
				class="w-1/4 inline-flex items-center justify-center p-0.5 overflow-hidden text-xs text-white bg-lightgray hover:bg-gray-700 border-r border-gray-600"
				onclick={() => setAmountPercentage(0.5)}
			>
				<span class="relative px-2 py-1 transition-all ease-in duration-75 group-hover:bg-opacity-0"
					>50%</span
				>
			</button>
			<button
				class="w-1/4 inline-flex items-center justify-center p-0.5 overflow-hidden text-xs text-white bg-lightgray hover:bg-gray-700 border-r border-gray-600"
				onclick={() => setAmountPercentage(0.75)}
			>
				<span class="relative px-2 py-1 transition-all ease-in duration-75 group-hover:bg-opacity-0"
					>75%</span
				>
			</button>
			<button
				class="w-1/4 inline-flex items-center justify-center p-0.5 overflow-hidden text-xs text-white bg-lightgray hover:bg-gray-700 border-gray-600 rounded-r-md"
				onclick={() => setAmountPercentage(1)}
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
