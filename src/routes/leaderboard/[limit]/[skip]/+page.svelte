<script>
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import Leaderboard from '$lib/components/Leaderboard.svelte';
	export let data;

	let limit = Number($page.params.limit);
	let skip = Number($page.params.skip);

	function updatePagination(newLimit, newSkip) {
		goto(`/leaderboard/${newLimit}/${newSkip}`);
	}
	console.log(data);
</script>

{#if data?.leaderboardData}
	<Leaderboard {data} {updatePagination} {limit} {skip} />
{:else}
	<div>Loading leaderboard data...</div>
{/if}
