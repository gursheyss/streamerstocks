<script lang="ts">
	import Leaderboard from '$lib/components/Leaderboard.svelte';
	export let data;

	let numRows = 10;
</script>

{#if data}
	<Leaderboard {numRows} fetchLeaderboardData={() => Promise.resolve(data.marketData)} />
{:else}
	<div>Loading leaderboard data...</div>
{/if}
