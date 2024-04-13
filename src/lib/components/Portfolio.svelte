<script lang="ts">
	interface Props {
		balance: number;
		netWorth: number;
	}

	let { balance, netWorth }: Props = $props();
</script>

<div class="bg-gray shadow-lg rounded-lg p-6 font-inter">
	<div class="flex items-center justify-between">
		<div>
			<p class="text-2xl font-bold text-white mb-2">Networth: ${netWorth.toFixed(2)}</p>
			<h3 class="text-xl text-white">Balance: ${balance.toFixed(2)}</h3>
		</div>
		<slot />
	</div>
</div>
