<script>
	import { invalidate, invalidateAll } from '$app/navigation';

	let { data } = $props();

	let supabase = $derived(data.supabase);

	async function signInWithTwitch() {
		await supabase.auth.signInWithOAuth({
			provider: 'twitch',
			options: {
				redirectTo: 'http://localhost:5173/auth/callback'
			}
		});
	}
</script>

<button on:click={signInWithTwitch}>Sign in with Twitch</button>
<form action="?/signOut" method="POST">
	<button type="submit">Sign out</button>
</form>
{data.session?.user.email}
