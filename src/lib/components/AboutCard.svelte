<script lang="ts">
    let { title, description, side, img_url }: { title:string, description:string, side:string, img_url:string } = $props();
</script>

<div class="flex w-full rounded-lg shadow-lg font-inter min-h-72 bg-gray2 py-14 px-20 mb-10">
    {#if side === "left"}
        <div class="w-2/3 space-y-2 h-full">
            <div class="h-full">
                <h4 class="text-xl font-bold font-inter mb-10">{title}</h4>
                <p class="text-s whitespace-pre-line leading-8">{description}</p>
            </div>
        </div>
        <div class="flex w-1/3 space-y-2 justify-end items-center">
            <img 
                class="rounded"
                src={img_url}
                height=300
                width=300
                alt="Jay-San"
            />
        </div>
    {:else}
        <div class="flex w-1/3 space-y-2 justify-start items-center">
            <img 
                class="rounded"
                src={img_url}
                height=300
                width=300
                alt="Jay-San"
            />
        </div>
        <div class="w-2/3 space-y-2 h-full">
            <div class="h-full">
                <h4 class="text-xl font-bold font-inter mb-10">{title}</h4>
                <p class="text-s whitespace-pre-line leading-8">{description}</p>
            </div>
        </div>
    {/if}
    
</div>