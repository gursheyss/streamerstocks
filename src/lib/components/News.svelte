<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { News } from '$lib/types';

	let { news }: { news: News[] } = $props();

	// Duplicate the news items for infinite scrolling
	let totalNews = $derived([...news, ...news]);

	let intervalId: number;

	onMount(() => {
		const newsBar = document.getElementById('news-bar');
		if (newsBar) {
			intervalId = setInterval(() => {
				newsBar.scrollLeft += 1;
				if (newsBar.scrollLeft >= newsBar.scrollWidth / 2) {
					newsBar.scrollLeft = 0;
				}
			}, 30);
		}
	});

	onDestroy(() => {
		if (intervalId) {
			clearInterval(intervalId);
		}
	});
</script>

<div class="flex text-inter overflow-x-auto whitespace-nowrap p-2 bg-gray2" id="news-bar">
	{#each totalNews as item}
		<div
			class={`inline-block p-1 mr-2 rounded-md ${item.type === 'negative' ? 'text-red-400' : 'text-green-400'}`}
		>
			{item.news}
		</div>
	{/each}
</div>

<style>
	#news-bar::-webkit-scrollbar {
		display: none;
	}
</style>
