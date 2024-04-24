<script lang="ts">
	import Leaderboard from '$lib/components/Leaderboard.svelte';
	let { data } = $props();

	let numRows = 10;
</script>

{#if data?.leaderboardData}
	<Leaderboard {numRows} leaderboardData={data.leaderboardData} />
{:else}
	<div>Loading leaderboard data...</div>
{/if}
