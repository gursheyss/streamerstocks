<script lang="ts">
	import type { Profile } from '$lib/types';
	import { onMount } from 'svelte';

	export let numRows: number;
	export let fetchLeaderboardData: () => Promise<
		(Profile & { pnl?: number; net_worth?: number; trade_count: number })[]
	>;

	let leaderboardData: (Profile & { pnl?: number; net_worth?: number; trade_count: number })[] = [];
	let loading = true;
	let sortColumn = 'net_worth'; // default sort column
	let sortOrder = 'asc'; // default sort order

	onMount(async () => {
		try {
			leaderboardData = await fetchLeaderboardData();
			sortData();
			loading = false;
		} catch (error) {
			console.error('Failed to fetch leaderboard data:', error);
			loading = false;
		}
	});
	function sortData(column = sortColumn) {
		if (column === sortColumn) {
			sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
		} else {
			sortColumn = column;
			sortOrder = 'asc';
		}

		leaderboardData = leaderboardData.sort((a, b) => {
			const valueA = (a as any)[sortColumn] ?? 0;
			const valueB = (b as any)[sortColumn] ?? 0;
			return sortOrder === 'asc' ? valueA - valueB : valueB - valueA;
		});
	}
	function getSortIcon() {
		return '<i class="fas fa-sort"></i>';
	}
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
						<!-- Will add back once trade history is implemented. -->
						<!-- <th class="text-left py-2 cursor-pointer" on:click={() => sortData('trade_count')}>
							# of Trades {@html getSortIcon()}
						</th> -->
						<th class="text-left py-2 cursor-pointer" on:click={() => sortData('pnl')}>
							PnL {@html getSortIcon()}
						</th>
						<th class="text-left py-2 cursor-pointer" on:click={() => sortData('net_worth')}>
							Balance {@html getSortIcon()}
						</th>
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
							<!-- Will add back once trade history is implemented. -->
							<!-- <td class="py-4 items-center">
								<span>{leaderboardItem.trade_count}</span>
							</td> -->

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
		{#if leaderboardData.length > 10}
			<div class="flex justify-center mt-4">
				<button class="flex text-white font-bold" on:click={() => (numRows += 10)}>
					Load More
				</button>
			</div>
		{/if}
	</div>
{/if}
