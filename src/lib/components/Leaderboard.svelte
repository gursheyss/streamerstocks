<script lang="ts">
	import type { Profile } from '$lib/types';

	let { data, updatePagination, limit, skip } = $props();

	let sortColumn = $state('pnl'); // default sort column
	let sortOrder = $state('asc'); // default sort order

	function sortData(column: string) {
		if (column === sortColumn) {
			sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
		} else {
			sortColumn = column;
			sortOrder = 'asc';
		}

		data.leaderboardData = data.leaderboardData.sort((a, b) => {
			const valueA = a[sortColumn] ?? 0;
			const valueB = b[sortColumn] ?? 0;
			return sortOrder === 'asc' ? valueA - valueB : valueB - valueA;
		});
	}

	function getSortIcon(column: string) {
		return sortColumn === column ? (sortOrder === 'asc' ? '↓' : '↑') : '';
	}

	function handleRowClick(username: string) {
		window.location.href = `/portfolio/${username}`;
	}

	function nextPage() {
		if (data.nextPage != null) {
			updatePagination(limit, data.nextPage);
		}
	}

	function prevPage() {
		if (data.prevPage != null) {
			updatePagination(limit, data.prevPage);
		}
	}
</script>

{#if data.leaderboardData.length > 0}
	<div class="bg-gray2 rounded-lg shadow-lg p-4 font-inter">
		<div class="flex flex-col items-center mb-4">
			<h2 class="text-xl font-bold text-white">Leaderboard</h2>
			<p class="text-xs text-gray-400 italic">Updates Every 5 Minutes</p>
		</div>
		<div class="overflow-x-auto">
			<div class="inline-block min-w-full">
				<div class="overflow-hidden">
					<table class="min-w-full divide-y divide-gray-700">
						<thead>
							<tr class="text-white font-bold">
								<th class="px-6 py-3 text-left cursor-pointer" on:click={() => sortData('rank')}>
									Rank {getSortIcon('rank')}
								</th>
								<th class="px-6 py-3 text-left">User</th>
								<th
									class="px-6 py-3 text-left cursor-pointer"
									on:click={() => sortData('trade_count')}
								>
									# of Trades {getSortIcon('trade_count')}
								</th>
								<th class="px-6 py-3 text-left cursor-pointer" on:click={() => sortData('pnl')}>
									PnL {getSortIcon('pnl')}
								</th>
								<th
									class="px-6 py-3 text-left cursor-pointer"
									on:click={() => sortData('net_worth')}
								>
									Networth {getSortIcon('net_worth')}
								</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-gray-700">
							{#each data.leaderboardData as leaderboardItem}
								<tr
									class="text-white font-bold hover:bg-lightgray cursor-pointer"
									on:click={() => handleRowClick(leaderboardItem.username)}
								>
									<td class="px-6 py-4 whitespace-nowrap">{leaderboardItem.rank}</td>
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
									<td class="px-6 py-4 whitespace-nowrap">{leaderboardItem.trade_count}</td>
									<td class="px-6 py-4 whitespace-nowrap">
										<span
											class={leaderboardItem.pnl > 0
												? 'text-green-400'
												: leaderboardItem.pnl < 0
													? 'text-red-400'
													: 'text-gray-400'}
										>
											{leaderboardItem.pnl >= 0 ? '+' : '-'}${Math.abs(
												leaderboardItem.pnl
											).toLocaleString(undefined, {
												minimumFractionDigits: 2,
												maximumFractionDigits: 2
											})}
										</span>
									</td>
									<td class="px-6 py-4 whitespace-nowrap">
										<span class="text-white"
											>${leaderboardItem.net_worth.toLocaleString(undefined, {
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
		<div class="flex justify-evenly mt-4">
			<button
				class="px-4 py-2 bg-blue-500 text-white font-bold rounded hover:bg-blue-700"
				on:click={prevPage}
				disabled={skip === 0}>Previous</button
			>
			<button
				class="px-4 py-2 space-x-2 bg-blue-500 text-white font-bold rounded hover:bg-blue-700"
				on:click={nextPage}
				disabled={!data.nextPage}>Next</button
			>
		</div>
	</div>
{:else}
	<div class="flex mt-16 justify-center h-screen">Fetching data...</div>
{/if}
