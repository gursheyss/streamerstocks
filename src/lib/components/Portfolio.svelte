<script lang="ts">
	interface Props {
		balance: number;
		netWorth: number;
	}

	interface History {
		date: string;
		balance: number;
	}

	let { balance, netWorth }: Props = $props();
</script>

<div class="bg-gray shadow-lg rounded-lg p-6">
	<div class="flex items-center justify-between">
		<div>
			<h3 class="text-2xl font-bold font-inter">Total Account Value: ${netWorth.toFixed(2)}</h3>
			<p>Buying Power: ${balance.toFixed(2)}</p>
		</div>
	</div>
</div>
