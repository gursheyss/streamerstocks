<script lang="ts">
	import type { Profile } from '$lib/types';

	let {
		numRows,
		leaderboardData
	}: { numRows: number; leaderboardData: (Profile & { totalValuation?: number })[] } = $props();
</script>

<div class="bg-gray2 rounded-lg shadow-lg p-4 font-inter">
	<div class="flex justify-center items-center mb-4 m-2">
		<h2 class="text-xl font-bold text-white">Leaderboard</h2>
	</div>
	<div class="flex m-2">
		<table class="w-full border-b border-gray-700">
			<thead>
				<tr class="text-white font-bold">
					<th class="text-left py-2">Rank</th>
					<th class="text-left py-2">User</th>
					<th class="text-left py-2">P&L</th>
					<!-- TODO: Need to change Balance to Net Worth -->
					<th class="text-right py-2">Balance</th>
				</tr>
			</thead>
			<tbody>
				{#each leaderboardData.slice(0, numRows) as leaderboardItem, index}
					<tr class="text-white font-bold items-center">
						<td class="py-4 items-center">
							<span>{index + 1}</span>
						</td>
						<td class="py-4 flex items-center">
							<img
								src={leaderboardItem.avatar_url}
								alt="avatar"
								class="w-8 h-8 rounded-full mr-2"
							/>
							<span>{leaderboardItem.username}</span>
						</td>
						<td class="py-4 items-center">
							<span
								class={leaderboardItem.totalValuation > 0
									? 'text-green-400'
									: leaderboardItem.totalValuation < 0
										? 'text-red-400'
										: 'text-gray-400'}
							>
								{leaderboardItem.totalValuation >= 0 ? '+' : ''}
								${leaderboardItem.totalValuation.toFixed(2)}
							</span>
						</td>
						<td class="py-4 items-center">
							<!-- TODO: Need to change Balance to Net Worth -->
							<span class="float-right">${leaderboardItem.balance.toFixed(2)}</span>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
	<div class="flex justify-center mt-4">
		<button class="flex text-white font-bold" on:click={() => (numRows += 10)}> Load More </button>
	</div>
</div>
