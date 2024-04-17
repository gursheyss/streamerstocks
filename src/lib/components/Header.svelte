<script lang="ts">
	import { enhance } from '$app/forms';
	import type { SupabaseClient } from '@supabase/supabase-js';
	import { page } from '$app/stores';

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

	let showMenu = $state(false);

	function toggleMenu() {
		showMenu = !showMenu;
	}
</script>

<header class="py-4">
	<div class="container mx-auto flex items-center justify-between px-4">
		<div class="flex items-center space-x-2">
			<button class="text-white text-2xl md:hidden" on:click={toggleMenu}> &#9776; </button>
			<a href="/">
				<div class="flex items-center space-x-2">
					<span class="text-white text-2xl">📈</span>
					<h1 class="text-white text-2xl font-bold font-inter">BopStocks</h1>
				</div>
			</a>
		</div>
		<div class="hidden md:block">
			<div class="flex items-baseline space-x-4 lg:space-x-8">
				<!-- Navigation Links -->
				<a
					class="text-gray-500 hover:text-white text-sm font-medium"
					href="/"
					class:text-white={$page.url.pathname === '/'}>Home</a
				>
				{#if username}
					<a
						class="text-gray-500 hover:text-white text-sm font-medium"
						href={`/portfolio/${username}`}
						class:text-white={$page.url.pathname === `/portfolio/${username}`}>Portfolio</a
					>
				{/if}
				<a
					class="text-gray-500 hover:text-white text-sm font-medium"
					href="/leaderboard"
					class:text-white={$page.url.pathname === '/leaderboard'}>Leaderboard</a
				>
				<a
					class="text-gray-500 hover:text-white text-sm font-medium"
					href="https://discord.gg/2asZArVb7s"
					target="_blank">Contact/Feedback</a
				>
				<a
					class="text-gray-500 hover:text-white text-sm font-medium"
					href="/about"
					class:text-white={$page.url.pathname === '/about'}>About</a
				>
			</div>
		</div>
		<div class="flex items-center space-x-4">
			{#if username}
				<img src={profilePicture} alt="avatar" class="w-8 h-8 rounded-full" />
				<span class="text-white font-inter font-bold hidden md:inline">{username}</span>
				<form action="/?/signOut" method="POST" use:enhance class="hidden md:block">
					<button
						id="SignOutButton"
						class="bg-white text-black px-4 py-2 rounded font-bold font-inter whitespace-nowrap"
						type="submit"
					>
						Sign out
					</button>
				</form>
			{:else}
				<button
					id="SignInButton"
					class="bg-white text-black px-4 py-2 rounded font-inter flex items-center space-x-2"
					on:click={signInWithTwitch}
				>
					<img
						src="https://upload.wikimedia.org/wikipedia/commons/2/20/Twitch_icon_2012.svg"
						alt="Twitch logo"
						class="h-5 w-5"
					/>
					<span>Sign in</span>
				</button>
			{/if}
		</div>
	</div>
	{#if showMenu}
		<div class="md:hidden">
			<div class="px-2 pt-2 pb-3 space-y-1">
				<a
					class="text-gray-500 hover:text-white block text-base font-medium"
					href="/"
					class:text-white={$page.url.pathname === '/'}>Home</a
				>
				{#if username}
					<a
						class="text-gray-500 hover:text-white block text-base font-medium"
						href={`/portfolio/${username}`}
						class:text-white={$page.url.pathname === `/portfolio/${username}`}>Portfolio</a
					>
				{/if}
				<a
					class="text-gray-500 hover:text-white block text-base font-medium"
					href="/leaderboard"
					class:text-white={$page.url.pathname === '/leaderboard'}>Leaderboard</a
				>
				<a
					class="text-gray-500 hover:text-white text-base font-medium"
					href="https://discord.gg/2asZArVb7s"
					target="_blank">Contact/Feedback</a
				>
				<a
					class="text-gray-500 hover:text-white block text-base font-medium"
					href="/about"
					class:text-white={$page.url.pathname === '/about'}>About</a
				>
				{#if username}
					<form action="/?/signOut" method="POST" use:enhance>
						<button
							class="text-gray-500 hover:text-white block w-full text-left text-base font-medium"
							type="submit"
						>
							Sign out
						</button>
					</form>
				{/if}
			</div>
		</div>
	{/if}
</header>
