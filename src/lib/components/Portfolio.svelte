<script lang="ts">
	interface Props {
		balance: number;
		netWorth: number;
	}

	let { balance, netWorth }: Props = $props();
</script>

<div class="bg-gray rounded-lg sm:p-6 font-inter">
	<div class="flex flex-col md:flex-row items-start md:items-center justify-between">
		<div>
			<p class="text-2xl font-bold text-white mb-2">
				Networth: ${Number(netWorth).toLocaleString(undefined, {
					minimumFractionDigits: 2,
					maximumFractionDigits: 2
				})}
			</p>
			<h3 class="text-xl text-white">
				Balance: ${Number(balance).toLocaleString(undefined, {
					minimumFractionDigits: 2,
					maximumFractionDigits: 2
				})}
			</h3>
		</div>
		<div class="mt-4 md:mt-0">
			<slot />
		</div>
	</div>
</div>
