<script lang="ts">
	import type { Profile } from '$lib/types.js';

	let { data } = $props();

	let marketData = $derived<(Profile & { totalValuation?: number })[]>(data.marketData);
</script>

<pre>{JSON.stringify(marketData, null, 2)}</pre>
