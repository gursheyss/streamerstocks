<script lang="ts">
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';

	let timeZone = $state(Intl.DateTimeFormat().resolvedOptions().timeZone);
</script>

<div>
	<form
		action="?/create"
		method="POST"
		use:enhance={() => {
			return async ({ result, update }) => {
				if (result.type === 'success') {
					toast.success('Prediction added successfully');
				}
			};
		}}
	>
		<div class="pt-4 pr-4 font-inter">
			<div class="p-4 w-full border-2 rounded-[9px] border-lightgray">
				<div class="text-lg mb-4 flex justify-center space-x-2">
					<span class="font-semibold">Add Prediction</span>
				</div>
				<div class="space-y-2">
					<input
						class="w-full border text-center border-gray-600 bg-lightgray rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:lightgray"
						placeholder="Enter title"
						type="text"
						name="title"
						required
					/>
					<input
						class="w-full border text-center border-gray-600 bg-lightgray rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:lightgray"
						placeholder="Enter options (comma separated)"
						type="text"
						name="options"
						required
					/>
					<input
						class="w-full border text-center border-gray-600 bg-lightgray rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:lightgray"
						placeholder="Enter end date/time"
						type="datetime-local"
						name="end_time"
						required
					/>
					<input type="hidden" name="time_zone" value={timeZone} />
				</div>

				<button
					class="mt-4 w-full relative inline-flex items-center justify-center p-0.5 overflow-hidden text-sm text-white rounded-lg bg-lightgray hover:bg-gray-700"
					type="submit"
				>
					<span
						class="relative px-5 py-2.5 transition-all ease-in duration-75 rounded-md group-hover:bg-opacity-0"
					>
						Add
					</span>
				</button>
			</div>
		</div>
	</form>
</div>
