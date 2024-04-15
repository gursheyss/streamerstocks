<script lang="ts">
	import type { Profile } from '$lib/types';
	import { onMount } from 'svelte';

	export let numRows: number;
	export let fetchLeaderboardData: () => Promise<Profile[]>;

	let leaderboardData: Profile[] = [];
	let loading = true;
	let sortColumn = 'net_worth'; // default sort column
	let sortOrder = 'asc'; // default sort order

	onMount(async () => {
		// console.log('Fetching leaderboard data...');
		loading = true;
		try {
			leaderboardData = await fetchLeaderboardData();
			sortData();
		} catch (error) {
			console.error('Failed to fetch leaderboard data:', error);
		}
		loading = false;
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
	function handleRowClick(username: string) {
		window.location.href = `/portfolio/${username}`;
	}
</script>

{#if loading}
	<div class="flex mt-16 justify-center h-screen">Fetching data...</div>
{:else}
	<div class="bg-gray2 rounded-lg shadow-lg p-4 font-inter">
		<div class="flex flex-col items-center mb-4">
			<h2 class="text-xl font-bold text-white">Leaderboard</h2>
			<p class="text-xs text-gray-400 italic">Updates every 5 minutes</p>
		</div>
		<div class="overflow-x-auto">
			<div class="inline-block min-w-full">
				<div class="overflow-hidden">
					<table class="min-w-full divide-y divide-gray-700">
						<thead>
							<tr class="text-white font-bold">
								<th class="px-6 py-3 text-left cursor-pointer" on:click={() => sortData('rank')}>
									Rank {@html getSortIcon()}
								</th>
								<th class="px-6 py-3 text-left">User</th>
								<th
									class="px-6 py-3 text-left cursor-pointer"
									on:click={() => sortData('trade_count')}
								>
									# of Trades {@html getSortIcon()}
								</th>
								<th class="px-6 py-3 text-left cursor-pointer" on:click={() => sortData('pnl')}>
									PnL {@html getSortIcon()}
								</th>
								<th
									class="px-6 py-3 text-left cursor-pointer"
									on:click={() => sortData('net_worth')}
								>
									Networth {@html getSortIcon()}
								</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-gray-700">
							{#each leaderboardData.slice(0, numRows) as leaderboardItem, index}
								<tr
									class="text-white font-bold hover:bg-lightgray cursor-pointer"
									on:click={() => handleRowClick(leaderboardItem.username)}
								>
									<td class="px-6 py-4 whitespace-nowrap">
										<span>{leaderboardItem.rank}</span>
									</td>
									<td class="px-6 py-4 whitespace-nowrap">
										<div class="flex items-center">
											<img
												src={leaderboardItem.avatar_url}
												alt="avatar"
												class="w-8 h-8 rounded-full mr-2"
											/>
											<span>{leaderboardItem.username}</span>
										</div>
									</td>
									<td class="px-6 py-4 whitespace-nowrap">
										<span>{leaderboardItem.trade_count}</span>
									</td>
									<td class="px-6 py-4 whitespace-nowrap">
										<span
											class={leaderboardItem.pnl > 0
												? 'text-green-400'
												: leaderboardItem.pnl < 0
													? 'text-red-400'
													: 'text-gray-400'}
										>
											{leaderboardItem.pnl >= 0 ? '+' : ''}${leaderboardItem.pnl?.toFixed(2)}
										</span>
									</td>
									<td class="px-6 py-4 whitespace-nowrap">
										<span class="text-white">${leaderboardItem.net_worth.toFixed(2)}</span>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		</div>
		{#if numRows < leaderboardData.length}
			<div class="flex justify-center mt-4">
				<button class="flex text-white font-bold" on:click={() => (numRows += 10)}>
					Load More
				</button>
			</div>
		{/if}
	</div>
{/if}
