<script lang="ts">
	import type { Comment } from '$lib/types';
	import { ThumbsDown, ThumbsUp } from 'lucide-svelte';

	export let comments: Comment[] = [];
	let newComment = '';

	function handleSubmit() {
		if (newComment.trim()) {
			// Add logic to submit the new comment
			console.log('New comment:', newComment);
			newComment = '';
		}
	}
</script>

<div class="bg-gray2 p-6 rounded-lg shadow-md font-inter text-white">
	<h2 class="text-2xl font-bold mb-4">Comments</h2>

	<div class="mb-6 flex">
		<textarea
			class="w-full border border-gray-600 bg-lightgray rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:lightgray mr-2"
			placeholder="Write a comment..."
			bind:value={newComment}
			rows={1}
		/>
		<button
			class="bg-lightgray text-white py-2 px-4 rounded-md transition-colors duration-300"
			on:click={handleSubmit}
		>
			Submit
		</button>
	</div>

	<div class="space-y-4">
		{#each comments as comment (comment.id)}
			<div class="bg-lightgray p-4 rounded-md shadow">
				<div class="flex items-center mb-2">
					<img
						class="h-8 w-8 rounded-full mr-2"
						src={comment.avatar_url || '/default-avatar.png'}
						alt="Avatar"
					/>
					<span class="font-semibold">{comment.username || 'Anonymous'}</span>
				</div>
				<p class="text-gray-300">{comment.comment}</p>
			</div>
		{/each}
	</div>
</div>
