<script lang="ts">
	import Leaderboard from '$lib/components/Leaderboard.svelte';
import type { Profile } from '$lib/types.js';

	let { data } = $props();

	let marketData = $derived<(Profile & { totalValuation?: number })[]>(data.marketData);
</script>

<Leaderboard numRows={10} leaderboardData={marketData} />