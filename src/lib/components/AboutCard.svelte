<script lang="ts">
	let {
		title,
		description,
		side,
		img_url
	}: { title: string; description: string; side: string; img_url: string } = $props();
</script>

<div class="max-w-6xl mx-auto rounded-lg shadow-lg font-inter bg-gray2 my-8 overflow-hidden">
	<div class="md:flex {side === 'right' ? 'md:flex-row-reverse' : 'md:flex-row'}">
		<div class="md:w-2/3 p-10 space-y-2 flex flex-col justify-center">
			<h4 class="text-xl font-bold mb-4">{title}</h4>
			<p class="text-sm leading-8 whitespace-pre-line">{description}</p>
		</div>
		<div class="md:w-1/3">
			<img class="object-cover h-full w-full" src={img_url} alt="Image" />
		</div>
	</div>
</div>
