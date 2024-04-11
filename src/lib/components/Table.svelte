<script lang="ts">
	import type { MarketItem } from '$lib/types';

	let { marketData }: { marketData: MarketItem[] } = $props();
</script>

<div class="bg-gray-800 rounded-lg shadow-lg p-4">
	<h2 class="text-xl font-bold text-white mb-4">FEATURED ISSUERS 1 YEAR</h2>
	<table class="w-full border-b border-gray-700">
		<tbody>
			{#each marketData as item}
				<tr>
					<td class="py-4 flex items-center">
						{#if item.image}
							<img src={item.image} alt={item.name} class="w-6 h-6 mr-2" />
						{/if}
						<span class="text-white font-bold">{item.name}</span>
						<span class="text-gray-400 ml-2">${item.ticker}</span>
					</td>
					<td class="py-4 text-right">
						<span class="text-white font-bold">5303</span>
						<span class="text-gray-400 ml-1">Trades</span>
					</td>
					<td class="py-4 text-right">
						<span class="text-white font-bold">{item.price}</span>
					</td>
					<td class="py-4 text-right">
						<span class="text-green-500 font-bold">50%</span>
					</td>
					<td class="py-4 text-right">
						<svg class="w-20 h-6 ml-auto" viewBox="0 0 150 30">
							<path d="M 0 15 L 150 15" stroke="#444" stroke-width="1" fill="none" />
							<path d="M 0 15 L 150 0" stroke="#00ff00" stroke-width="1.5" fill="none" />
						</svg>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
