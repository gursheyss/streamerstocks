<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { Tabs } from 'bits-ui';
	import type { Prediction, Bet, PredictionOption } from '$lib/types';

	let {
		prediction,
		userBalance,
		userBets
	}: { prediction: Prediction; userBalance: number; userBets: Bet[] } = $props();

	let amount = $state('');
	let loading = $state(false);
	let currentTime = $state(new Date());
	let selectedOptionId = $state();
	let timer: NodeJS.Timeout;

	let isPredictionPending = prediction.status === 'PENDING';
	let isPredictionCompleted = prediction.status === 'COMPLETED';
	let winningOption =
		isPredictionCompleted && prediction.winning_option_id
			? prediction.options.find((option) => option.id === prediction.winning_option_id)
			: null;
	let userBet = $state(userBets.find((bet) => bet.prediction_id === prediction.id));
	let winningsAmount = calculateWinningsAmount(userBet, winningOption);
	let hasPlacedBet = $state(!!userBet);

	onMount(() => {
		timer = setInterval(updateCurrentTime, 1000);
	});

	onDestroy(() => {
		clearInterval(timer);
	});

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
			toast.error('An unexpected error occurred. Please try again later.');
		} finally {
			loading = false;
		}
	}
	function calculateWinningsAmount(
		userBet: Bet | undefined,
		winningOption: PredictionOption | null
	) {
		if (!isPredictionCompleted || !userBet || !winningOption) {
			return 0;
		}

		const isWinningBet = userBet.prediction_option_id === winningOption.id;
		const betAmount = userBet.amount;
		const winningOdds = winningOption.odds;

		return isWinningBet ? betAmount * winningOdds : -betAmount;
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
	function updateCurrentTime() {
		currentTime = new Date();
	}
	function calculateTimeLeft() {
		const endTime = new Date(prediction.end_time);
		const timeDiff = endTime.getTime() - currentTime.getTime();

		if (timeDiff <= 0) {
			return 'Submissions closed';
		}

		const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
		const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
		const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
		const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

		return `Submissions closing in: ${days}d ${hours}h ${minutes}m ${seconds}s`;
	}
</script>

<div
	class="flex flex-col justify-between prediction-component w-1/3 min-w-[300px] p-4 font-inter border border-lightgray m-4 rounded-[9px] text-white"
>
	<div class="header mb-4">
		<h2 class="text-lg font-semibold">{prediction.description}</h2>
		<span class="mt-2 text-xs flex justify-center">{calculateTimeLeft()}</span>
	</div>

	<Tabs.Root class="border-t border-b border-lightgray mb-1">
		<Tabs.List class="flex justify-center">
			{#each prediction.options as option (option.id)}
				<Tabs.Trigger
					value={option.id}
					onclick={() => selectOption(option.id)}
					class={isPredictionCompleted && winningOption && winningOption.id === option.id
						? 'tab-button mx-1 py-2 px-4 rounded-lg text-sm font-semibold text-green-500'
						: !isPredictionCompleted && selectedOptionId === option.id
							? 'tab-button mx-1 py-2 px-4 rounded-lg text-sm font-semibold text-blue-500'
							: !isPredictionCompleted && hasPlacedBet && userBet.prediction_option_id === option.id
								? 'tab-button mx-1 py-2 px-4 rounded-lg text-sm font-semibold text-blue-500'
								: 'tab-button mx-1 py-2 px-4 rounded-lg text-sm font-semibold'}
					disabled={hasPlacedBet || isPredictionPending || isPredictionCompleted}
				>
					{option.description} ({option.odds.toFixed(2)}x)<br />
					{option.poolPercentage.toFixed(2)}%
					<!-- - {option.bettorCount} bettors<br />
					Total: ${option.total_amount_bet} -->
				</Tabs.Trigger>
			{/each}
		</Tabs.List>
	</Tabs.Root>
	{#if isPredictionCompleted && winningOption}
		{#if userBets}
			<p class="text-white text-xs text-center border-t border-b border-lightgray mt-1 mb-1">
				{winningsAmount >= 0
					? `You won $${winningsAmount.toFixed(2)}`
					: `You lost $${Math.abs(winningsAmount).toFixed(2)}`}
			</p>
		{/if}
	{/if}
	<div class="custom-bet-input mt-2">
		{#if hasPlacedBet}
			<p class="text-white text-xs text-center">
				Bet Placed: <span class="font-bold"
					>${userBet?.amount.toLocaleString(undefined, {
						minimumFractionDigits: 2,
						maximumFractionDigits: 2
					})}</span
				>
				on
				<span class="font-bold"
					>{prediction.options.find((option) => option.id === userBet?.prediction_option_id)
						?.description}</span
				>
			</p>
		{:else if !isPredictionPending}
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
					<span
						class="relative px-2 py-1 transition-all ease-in duration-75 group-hover:bg-opacity-0"
						>25%</span
					>
				</button>
				<button
					class="w-1/4 inline-flex items-center justify-center p-0.5 overflow-hidden text-xs text-white bg-lightgray hover:bg-gray-700 border-r border-gray-600"
					onclick={() => setAmountPercentage(0.5)}
				>
					<span
						class="relative px-2 py-1 transition-all ease-in duration-75 group-hover:bg-opacity-0"
						>50%</span
					>
				</button>
				<button
					class="w-1/4 inline-flex items-center justify-center p-0.5 overflow-hidden text-xs text-white bg-lightgray hover:bg-gray-700 border-r border-gray-600"
					onclick={() => setAmountPercentage(0.75)}
				>
					<span
						class="relative px-2 py-1 transition-all ease-in duration-75 group-hover:bg-opacity-0"
						>75%</span
					>
				</button>
				<button
					class="w-1/4 inline-flex items-center justify-center p-0.5 overflow-hidden text-xs text-white bg-lightgray hover:bg-gray-700 border-gray-600 rounded-r-md"
					onclick={() => setAmountPercentage(1)}
				>
					<span
						class="relative px-2 py-1 transition-all ease-in duration-75 group-hover:bg-opacity-0"
						>Max</span
					>
				</button>
			</div>
		{/if}
	</div>

	<button
		class="place-bet-button w-full mt-4 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-700 rounded-lg py-2"
		onclick={placeBet}
		disabled={!amount ||
			!selectedOptionId ||
			loading ||
			hasPlacedBet ||
			isPredictionPending ||
			isPredictionCompleted}
	>
		{#if isPredictionCompleted}
			Winning Option: <strong>{winningOption?.description}</strong>
		{:else if hasPlacedBet}
			Bet Placed
		{:else if isPredictionPending}
			Submissions closed
		{:else if loading}
			Placing bet...
		{:else}
			Place Bet
		{/if}
	</button>
</div>
