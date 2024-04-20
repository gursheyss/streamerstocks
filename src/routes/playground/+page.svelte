<script lang="ts">
	import { Tabs } from 'bits-ui';
</script>

<Tabs.Content value="buy" class="pt-3">
	<div class="p-4">
		<input
			class="w-full border border-gray-600 bg-lightgray rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:lightgray"
			placeholder="Enter amount"
			required
		/>
		<button
			class="mt-4 w-full relative inline-flex items-center justify-center p-0.5 overflow-hidden text-sm font-medium text-gray-900 rounded-lg group bg-gradient-to-br from-teal-300 to-lime-300 group-hover:from-teal-300 group-hover:to-lime-300 dark:text-white dark:hover:text-gray-900 focus:ring-4 focus:outline-none focus:ring-lime-200 dark:focus:ring-lime-800"
		>
			<span
				class="relative px-5 py-2.5 transition-all ease-in duration-75 bg-white dark:bg-gray-900 rounded-md group-hover:bg-opacity-0"
			>
				Buy STOCK
			</span>
		</button>

		<div class="mt-4 text-sm text-gray-400">
			<p>Price: $CURRENT_PRICE / STOCK</p>
			<p>AMOUNT @ $AVG_PRICE_PER_SHARE = $TOTAL_COST</p>
			<p>Fee: $FEE_AMOUNT</p>
			<p>Total: $TOTAL_COST</p>
		</div>
	</div>
</Tabs.Content>

<Tabs.Content value="sell" class="pt-3">
	<div class="p-4">
		<input
			class="w-full border border-gray-600 bg-lightgray rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:lightgray"
			placeholder="Enter amount"
			required
		/>
		<button
			class="mt-4 w-full relative inline-flex items-center justify-center p-0.5 overflow-hidden text-sm font-medium text-gray-900 rounded-lg group bg-gradient-to-br from-pink-500 to-orange-400 group-hover:from-pink-500 group-hover:to-orange-400 hover:text-white dark:text-white focus:ring-4 focus:outline-none focus:ring-pink-200 dark:focus:ring-pink-800"
		>
			<span
				class="relative px-5 py-2.5 transition-all ease-in duration-75 bg-white dark:bg-gray-900 rounded-md group-hover:bg-opacity-0"
			>
				Sell STOCK
			</span>
		</button>

		<div class="mt-4 text-sm text-gray-400">
			<p>Price: $CURRENT_PRICE / STOCK</p>
			<p>AMOUNT @ $AVG_PRICE_PER_SHARE = $TOTAL_COST</p>
			<p>Fee: $FEE_AMOUNT</p>
			<p>Total: $TOTAL_COST</p>
		</div>
	</div>
</Tabs.Content>
