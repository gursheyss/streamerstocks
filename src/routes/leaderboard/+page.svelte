<script lang="ts">
	import Leaderboard from '$lib/components/Leaderboard.svelte';
	export let data; // This is the prop passed from the load function

	let numRows = 10; // Example, set your default or dynamic value here
</script>

{#if data}
	<Leaderboard {numRows} fetchLeaderboardData={() => Promise.resolve(data.marketData)} />
{:else}
	<p>Loading leaderboard data...</p>
{/if}
