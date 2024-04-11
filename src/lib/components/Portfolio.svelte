<script lang="ts">
	interface Props {
		balance: number;
	}

	interface History {
		date: string;
		balance: number;
	}

	let { balance }: Props = $props();
</script>

<div class="bg-gray shadow-lg rounded-lg p-6">
	<div class="flex items-center justify-between">
		<div>
			<h3 class="text-xl font-bold font-inter">Balance</h3>
			<p class="text-4xl font-bold font-inter">${balance}</p>
		</div>
	</div>
</div>
