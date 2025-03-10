<script lang="ts">
	import type { Profile } from '$lib/types';

	let { numRows, leaderboardData }: { numRows: number; leaderboardData: Profile[] } = $props();

	let loading = $state(true);
	let sortColumn = 'pnl'; // default sort column
	let sortOrder = 'asc'; // default sort order

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

<div class="bg-gray2 rounded-lg shadow-lg p-4 font-inter">
	<div class="flex flex-col items-center mb-4">
		<h2 class="text-xl font-bold text-white">Leaderboard</h2>
		<p class="text-xs text-gray-400 italic">Only displays the top 100 and bottom 100 for now</p>
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
							<!-- <th
								class="px-6 py-3 text-left cursor-pointer"
								on:click={() => sortData('trade_count')}
							>
								# of Trades {@html getSortIcon()}
							</th> -->
							<th class="px-6 py-3 text-left cursor-pointer" on:click={() => sortData('pnl')}>
								PnL {@html getSortIcon()}
							</th>
							<th class="px-6 py-3 text-left cursor-pointer" on:click={() => sortData('net_worth')}>
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
								<!-- <td class="px-6 py-4 whitespace-nowrap">
									<span>{leaderboardItem.trade_count}</span>
								</td> -->
								<td class="px-6 py-4 whitespace-nowrap">
									<span
										class={leaderboardItem.pnl > 0
											? 'text-green-400'
											: leaderboardItem.pnl < 0
												? 'text-red-400'
												: 'text-gray-400'}
									>
										{leaderboardItem.pnl >= 0 ? '+' : '-'}${Math.abs(
											Number(leaderboardItem.pnl ?? 0)
										).toLocaleString(undefined, {
											minimumFractionDigits: 2,
											maximumFractionDigits: 2
										})}
									</span>
								</td>
								<td class="px-6 py-4 whitespace-nowrap">
									<span class="text-white"
										>${Number(leaderboardItem.net_worth).toLocaleString(undefined, {
											minimumFractionDigits: 2,
											maximumFractionDigits: 2
										})}</span
									>
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
