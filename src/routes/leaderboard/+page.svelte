<script lang="ts">
	import Leaderboard from '$lib/components/Leaderboard.svelte';
	export let data;

	let numRows = 10;
</script>

{#if data?.leaderboardData}
	<Leaderboard {numRows} fetchLeaderboardData={() => Promise.resolve(data.leaderboardData)} />
{:else}
	<div>Loading leaderboard data...</div>
{/if}
