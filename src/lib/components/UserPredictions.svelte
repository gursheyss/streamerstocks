<script lang="ts">
	let { userPredictions } = $props();
</script>

<div class="bg-gray2 shadow overflow-hidden sm:rounded-lg p-6 overflow-x-auto">
	<h3 class="text-lg leading-6 font-medium text-gray-100 mb-4">Your Predictions</h3>
	{#if userPredictions.length === 0}
		<p class="text-sm text-gray-100">You haven't placed any bets on predictions yet.</p>
	{:else}
		<table class="min-w-full divide-y divide-gray-700">
			<thead class="bg-gray2">
				<tr>
					<th
						scope="col"
						class="px-6 py-3 text-left text-xs font-medium text-gray-100 uppercase tracking-wider"
					>
						Prediction
					</th>
					<th
						scope="col"
						class="px-6 py-3 text-left text-xs font-medium text-gray-100 uppercase tracking-wider"
					>
						Option
					</th>
					<th
						scope="col"
						class="px-6 py-3 text-left text-xs font-medium text-gray-100 uppercase tracking-wider"
					>
						Bet Amount
					</th>
					<th
						scope="col"
						class="px-6 py-3 text-left text-xs font-medium text-gray-100 uppercase tracking-wider"
					>
						Result
					</th>
				</tr>
			</thead>
			<tbody class="bg-gray2 divide-y divide-gray-700">
				{#each userPredictions as prediction}
					<tr>
						<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-100">
							{prediction.prediction_id.description}
						</td>
						<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-100">
							{prediction.prediction_option_id.description}
						</td>
						<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-100"
							>${prediction.amount.toLocaleString(undefined, {
								minimumFractionDigits: 0,
								maximumFractionDigits: 2
							})}
						</td>
						<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-100">
							{prediction.prediction_id.winning_option_id === prediction.prediction_option_id.id
								? 'Won'
								: 'Lost'}
							${Math.abs(prediction.amountWonOrLost).toLocaleString(undefined, {
								minimumFractionDigits: 0,
								maximumFractionDigits: 2
							})}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	{/if}
</div>
