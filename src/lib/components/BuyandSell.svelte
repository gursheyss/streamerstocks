<script lang="ts">
    let {uuid, stockID} : {uuid: string, stockID: number} = $props();
    let amount: string = $state('');
    async function updateStockAndBal(uuid: string, stockID: number,  amt: number) {
        const response = await fetch('/request_api', {
            method: 'POST',
            body: JSON.stringify({
                uuid,
                amt,
                stockID
            }),
            headers: {
                'Content-Type': 'application/json'
            }
        });
        console.log('server' + response);
    }
    function handleInput(event) {
    // Remove non-numeric characters from the input
        amount = event.target.value.replace(/\D/g, '');
    }
</script>

<div>
    <div class = "flex justify-center">
        <input class="w-72 w-full border border-gray-600 bg-lightgray rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:lightgray mr-2" bind:value={amount} placeholder="Enter # of Stocks"  on:input={handleInput}/>
    </div>
    <div class = "flex justify-end gap-4">
        <button class="relative inline-flex items-center justify-center p-0.5 mb-2 me-2 overflow-hidden text-sm font-medium text-gray-900 rounded-lg group bg-gradient-to-br from-teal-300 to-lime-300 group-hover:from-teal-300 group-hover:to-lime-300 dark:text-white dark:hover:text-gray-900 focus:ring-4 focus:outline-none focus:ring-lime-200 dark:focus:ring-lime-800" on:click={() => updateStockAndBal(uuid, stockID, Number(amount))}>
            <span class="relative px-5 py-2.5 transition-all ease-in duration-75 bg-white dark:bg-gray-900 rounded-md group-hover:bg-opacity-0">
            Buy
            </span>
        </button>
        <button class="relative inline-flex items-center justify-center p-0.5 mb-2 me-2 overflow-hidden text-sm font-medium text-gray-900 rounded-lg group bg-gradient-to-br from-pink-500 to-orange-400 group-hover:from-pink-500 group-hover:to-orange-400 hover:text-white dark:text-white focus:ring-4 focus:outline-none focus:ring-pink-200 dark:focus:ring-pink-800" on:click={() => updateStockAndBal(uuid, stockID, Number(amount))}>
            <span class="relative px-5 py-2.5 transition-all ease-in duration-75 bg-white dark:bg-gray-900 rounded-md group-hover:bg-opacity-0">
            Sell
            </span>
        </button>
    </div>
</div>