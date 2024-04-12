<script lang="ts">
	import type { Profile } from '$lib/types';
	import { onMount } from 'svelte';
	export let numRows: number;
	export let fetchLeaderboardData: () => Promise<
		(Profile & { pnl?: number; net_worth?: number })[]
	>;

	let leaderboardData: (Profile & { pnl?: number; net_worth?: number })[] = [];
	let loading = true;

	onMount(async () => {
		try {
			leaderboardData = await fetchLeaderboardData();
			loading = false;
		} catch (error) {
			console.error('Failed to fetch leaderboard data:', error);
			loading = false;
		}
	});
</script>

{#if loading}
	<div class="flex mt-16 justify-center h-screen">Fetching data...</div>
{:else}
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
						<th class="text-left py-2">PnL</th>
						<th class="text-left py-2">Networth</th>
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
									class={leaderboardItem.pnl > 0
										? 'text-green-400'
										: leaderboardItem.pnl < 0
											? 'text-red-400'
											: 'text-gray-400'}
								>
									{leaderboardItem.pnl >= 0 ? '+' : ''}
									${leaderboardItem.pnl?.toFixed(2)}
								</span>
							</td>
							<td class="py-4 items-center">
								<span class="text-white">${leaderboardItem.net_worth.toFixed(2)}</span>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
		<div class="flex justify-center mt-4">
			<button class="flex text-white font-bold" on:click={() => (numRows += 10)}>
				Load More
			</button>
		</div>
	</div>
{/if}
