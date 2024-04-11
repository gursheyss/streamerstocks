<script lang="ts">
	import type { Profile } from '$lib/types';

    let { numRows, leaderboardData }: { numRows: number, leaderboardData: (Profile & { totalValuation?: number })[] } = $props();
</script>

<div class="bg-gray2 rounded-lg shadow-lg p-4 font-inter">
	<h2 class="text-xl font-bold text-white mb-4">
        Leaderboard
    </h2>

	<table class="w-full border-b border-gray-700">
		<tbody>
            {#each leaderboardData.slice(0, numRows) as leaderboardItem, index}
                <tr class="text-white font-bold items-center">
                    <td class="py-4 items-center">
                        <span>{index+1}</span>
                    </td>
                    <td class="py-4 flex items-center">
                        <img src={leaderboardItem.avatar_url} alt="avatar" class="w-8 h-8 rounded-full mr-2" />
                        <span>{leaderboardItem.username}</span>
                    </td>
                    <td class="py-4 items-center">
                        <span class={
                            leaderboardItem.totalValuation > 0 ? "text-green-400" : 
                            leaderboardItem.totalValuation < 0 ? "text-red-400" : 
                            "text-gray-400"    
                        }>
                            {leaderboardItem.totalValuation >= 0 ? "+" : ""}
                            ${leaderboardItem.totalValuation.toFixed(2)}
                        </span>
                    </td>
                    <td class="py-4 items-center">
                        <span class="float-right">${leaderboardItem.balance.toFixed(2)}</span>
                    </td>
                </tr>
            {/each}
		</tbody>
	</table>
</div>