<script lang="ts">
	import { enhance } from '$app/forms';
	import { formatDistanceToNow, parseISO } from 'date-fns';
	import clsx from 'clsx';

	import type { Comment } from '$lib/types';
	import { toast } from 'svelte-sonner';

	let { comments, currentId }: { comments: Comment[]; currentId: string } = $props();
	let newComment = $state('');

	let isValid = $state(false);
	$effect(() => {
		isValid = /\w/.test(newComment);
	});
</script>

<div class="bg-gray2 sm:p-6 rounded-lg shadow-md font-inter text-white">
	<h2 class="text-2xl font-bold mb-4">Comments</h2>

	<form
		action="?/submitComment"
		method="POST"
		class="mb-6 flex"
		use:enhance={() => {
			return async ({ result }) => {
				if (result.type === 'success') {
					newComment = '';
					toast.success('Comment submitted successfully');
				}
				if (result.type === 'failure') {
					newComment = '';
					toast.error('You must be logged in to comment');
				}
			};
		}}
	>
		<textarea
			name="comment"
			class="w-full border border-gray-600 bg-lightgray rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:lightgray mr-2"
			placeholder="Write a comment..."
			bind:value={newComment}
			rows={1}
			required
		/>
		<input type="hidden" name="currentId" value={currentId} />
		<button
			type="submit"
			class="bg-lightgray text-white py-2 px-4 rounded-md transition-colors duration-300"
			disabled={!isValid}
		>
			Submit
		</button>
	</form>

	<div class="space-y-4">
		{#each comments as comment (comment.id)}
			<div class="bg-lightgray p-4 rounded-md shadow">
				<div class="flex items-center sm:mb-2">
					<img
						class="h-8 w-8 rounded-full mr-2"
						src={comment.avatar_url || '/default-avatar.png'}
						alt="Avatar"
					/>
					<div>
						<span
							class={clsx({
								'text-yellow-400': comment.label === 'dev',
								'text-purple-400': comment.label === 'streamer'
							})}
						>
							{#if comment.label}
								[{comment.label}]
							{/if}
						</span>
						<a href={`/portfolio/${comment.username}`}>
							<span class="font-semibold">{comment.username}</span>
						</a>

						<span class="text-gray-400 text-sm ml-2">
							{formatDistanceToNow(parseISO(comment.created_at))} ago
						</span>
					</div>
				</div>
				<p class="text-gray-300 pt-2 overflow-auto break-words">{comment.comment}</p>
			</div>
		{/each}
	</div>
</div>
