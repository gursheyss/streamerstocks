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
				redirectTo: `${window.location.origin}/auth/callback`
			}
		});
	}
</script>

<header class="py-4">
	<div class="container mx-auto flex items-center justify-between">
		<div class="flex items-center">
			<span class="text-white text-2xl mr-2">📈</span>
			<h1 class="text-white text-2xl font-bold font-inter">BopStocks</h1>
		</div>
		<div class="hidden md:block">
			<div class="ml-10 flex items-baseline space-x-4">
				<!-- Navigation Links -->
				<a class="text-gray-900 dark:text-white px-3 py-2 rounded-md text-sm font-medium" href="/"
					>Home</a
				>
				<a
					class="text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium"
					href="/portfolio">Portfolio</a
				>
				<a
					class="text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium"
					href="/leaderboard">Leaderboard</a
				>
				<a
					class="text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium"
					href="/about">About</a
				>
			</div>
		</div>
		<div class="flex items-center">
			{#if username}
				<img src={profilePicture} alt="avatar" class="w-8 h-8 rounded-full mr-2" />
				<span class="text-white font-inter font-bold mr-4">{username}</span>
				<form action="?/signOut" method="POST" use:enhance>
					<button
						id="SignOutButton"
						class="bg-white text-black px-4 py-2 rounded font-bold font-inter"
						type="submit"
					>
						Sign out
					</button>
				</form>
			{:else}
				<button
					id="SignInButton"
					class="bg-white text-black px-4 py-2 rounded font-inter flex items-center"
					on:click={signInWithTwitch}
				>
					<img
						src="https://upload.wikimedia.org/wikipedia/commons/2/20/Twitch_icon_2012.svg"
						alt="Twitch logo"
						style="height: 20px; width: 20px; margin-right: 10px;"
					/>
					Sign in
				</button>
			{/if}
		</div>
	</div>
</header>
