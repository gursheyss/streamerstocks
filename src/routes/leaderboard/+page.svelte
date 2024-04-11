<script lang="ts">
	import type { MarketItem } from '$lib/types.js';

	let { data } = $props();

	let marketData = $derived<MarketItem[]>(data.marketData);
</script>

{JSON.stringify(marketData)}
