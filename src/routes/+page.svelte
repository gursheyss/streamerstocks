<script>
	import { enhance } from '$app/forms';
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
<form action="?/signOut" method="POST" use:enhance>
	<button type="submit">Sign out</button>
</form>

<img src={data.session?.user.user_metadata.avatar_url} alt="avatar" />
