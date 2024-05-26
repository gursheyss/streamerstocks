<script lang="ts">
	import '../app.pcss';
	import { afterNavigate, beforeNavigate, invalidate, invalidateAll } from '$app/navigation';
	import { navigating } from '$app/stores';
	import Header from '$lib/components/Header.svelte';
	import { Toaster, toast } from 'svelte-sonner';
	import { browser } from '$app/environment';
	import posthog from 'posthog-js';

	let { data } = $props();
	let supabase = $derived(data.supabase);

	if (browser) {
		beforeNavigate(() => posthog.capture('$pageleave'));
		afterNavigate(() => posthog.capture('$pageview'));
	}

	$effect(() => {
		const {
			data: { subscription }
		} = supabase.auth.onAuthStateChange((event, _session) => {
			// If you want to fain grain which routes should rerun their load function
			// when onAuthStateChange changges
			// use invalidate('supabase:auth')
			// which is linked to +layout.js depends('supabase:auth').
			// This should mainly concern all routes
			//that should be accesible only for logged in user.
			// Otherwise use invalidateAll()
			// which will rerun every load function of you app.
			invalidate('supabase:auth');
			invalidateAll();
		});
		return () => subscription.unsubscribe();
	});
</script>

<Header
	{supabase}
	profilePicture={data.session?.user.user_metadata.avatar_url}
	username={data.session?.user.user_metadata.nickname}
/>
<Toaster richColors theme="dark" />
{#if $navigating}
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-center items-center">
		<span class="loading loading-dots loading-md text-neutral"></span>
	</div>
{:else}
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<slot />
	</div>
{/if}
