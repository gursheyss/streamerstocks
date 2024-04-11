<script lang="ts">
	import { enhance } from '$app/forms';
	import type { SupabaseClient } from '@supabase/supabase-js';

	let {
		supabase,
		profilePicture,
		username
	}: { supabase: SupabaseClient<any, 'public', any>; profilePicture: string; username: string } =
		$props();
	async function signInWithTwitch() {
		await supabase.auth.signInWithOAuth({
			provider: 'twitch',
			options: {
				redirectTo: 'http://localhost:5173/auth/callback'
			}
		});
	}
</script>

<header class="py-4">
	<div class="container mx-auto flex items-center justify-between">
		<div class="flex items-center">
			<span class="text-white text-2xl font-inter mr-2">📈</span>
			<h1 class="text-white text-2xl font-inter">BopStocks</h1>
		</div>
		<div class="flex items-center">
			{#if username}
				<img src={profilePicture} alt="avatar" class="w-8 h-8 rounded-full mr-2" />
				<span class="text-white font-inter mr-4">{username}</span>
				<form action="?/signOut" method="POST" use:enhance>
					<button
						id="SignOutButton"
						class="bg-white text-black px-4 py-2 rounded font-inter"
						type="submit"
					>
						Sign out
					</button>
				</form>
			{:else}
				<button
					id="SignInButton"
					class="bg-white text-black px-4 py-2 rounded font-inter"
					on:click={signInWithTwitch}
				>
					Sign in with Twitch
				</button>
			{/if}
		</div>
	</div>
</header>
