<script lang="ts">
	import { invalidate, invalidateAll } from '$app/navigation';

	let { data } = $props();
	let supabase = $derived(data.supabase);

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

<slot />
