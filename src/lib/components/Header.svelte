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
			options: { redirectTo: `${window.location.origin}/auth/callback` }
		});
	}

	let showMenu = $state(false);

	function toggleMenu() {
		showMenu = !showMenu;
	}
</script>

<header class="py-4">
	<div class="container mx-auto flex items-center justify-between px-4">
		<div class="flex items-center">
			<button class="text-white text-2xl mr-2 md:hidden" on:click={toggleMenu}>&#9776;</button>
			<a href="/">
				<div class="flex items-center">
					<span class="text-white text-2xl mr-2">📈</span>
					<h1 class="text-white text-2xl font-bold font-inter">BopStocks</h1>
				</div>
			</a>
		</div>

		<div class="hidden md:block">
			<div class="ml-10 flex items-baseline space-x-4">
				<!-- Navigation Links -->
				<a
					class="text-gray-500 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
					href="/"
					class:text-white={$page.url.pathname === '/'}>Home</a
				>
				{#if username}
					<a
						class="text-gray-500 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
						href="/portfolio"
						class:text-white={$page.url.pathname === '/portfolio'}>Portfolio</a
					>
				{/if}
				<a
					class="text-gray-500 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
					href="/leaderboard"
					class:text-white={$page.url.pathname === '/leaderboard'}>Leaderboard</a
				>
				<a
					class="text-gray-500 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
					href="/about"
					class:text-white={$page.url.pathname === '/about'}>About</a
				>
				<a
					class="text-gray-500 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
					href="https://forms.gle/t6rmVi7uCFU3qmbZ6"
					target="_blank">Feedback</a
				>
			</div>
		</div>

		<div class="flex items-center">
			{#if username}
				<img src={profilePicture} alt="avatar" class="w-8 h-8 rounded-full mr-2" />
				<span class="text-white font-inter font-bold mr-4 hidden md:inline">{username}</span>
				<form action="?/signOut" method="POST" use:enhance class="hidden md:block">
					<button
						id="SignOutButton"
						class="bg-white text-black px-4 py-2 rounded font-bold font-inter"
						type="submit">Sign out</button
					>
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

	{#if showMenu}
		<div class="md:hidden">
			<div class="px-2 pt-2 pb-3 space-y-4">
				<a
					class="text-gray-500 hover:text-white block px-3 rounded-md text-base font-medium"
					href="/"
					class:text-white={$page.url.pathname === '/'}>Home</a
				>
				{#if username}
					<a
						class="text-gray-500 hover:text-white block px-3 rounded-md text-base font-medium"
						href="/portfolio"
						class:text-white={$page.url.pathname === '/portfolio'}>Portfolio</a
					>
				{/if}
				<a
					class="text-gray-500 hover:text-white block px-3 rounded-md text-base font-medium"
					href="/leaderboard"
					class:text-white={$page.url.pathname === '/leaderboard'}>Leaderboard</a
				>
				<a
					class="text-gray-500 hover:text-white block px-3 rounded-md text-base font-medium"
					href="/about"
					class:text-white={$page.url.pathname === '/about'}>About</a
				>
				<a
					class="text-gray-500 hover:text-white block px-3 rounded-md text-base font-medium"
					href="https://forms.gle/t6rmVi7uCFU3qmbZ6"
					target="_blank">Feedback</a
				>
				{#if username}
					<form action="?/signOut" method="POST" use:enhance>
						<button
							class="text-gray-500 hover:text-white block w-full text-left px-3 rounded-md text-base font-medium"
							type="submit">Sign out</button
						>
					</form>
				{/if}
			</div>
		</div>
	{/if}
</header>
