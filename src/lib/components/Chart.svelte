<script lang="ts">
	import { onMount } from 'svelte';
	import Chart from 'chart.js/auto';

	const stockHistory = [
		{ timestamp: '2023-05-01', price: 100.0 },
		{ timestamp: '2023-05-02', price: 102.5 },
		{ timestamp: '2023-05-03', price: 99.75 },
		{ timestamp: '2023-05-04', price: 105.25 },
		{ timestamp: '2023-05-05', price: 103.8 },
		{ timestamp: '2023-05-06', price: 107.1 },
		{ timestamp: '2023-05-07', price: 108.5 },
		{ timestamp: '2023-05-08', price: 106.2 },
		{ timestamp: '2023-05-09', price: 109.75 },
		{ timestamp: '2023-05-10', price: 111.3 },
		{ timestamp: '2023-05-11', price: 113.6 },
		{ timestamp: '2023-05-12', price: 112.4 },
		{ timestamp: '2023-05-13', price: 115.0 },
		{ timestamp: '2023-05-14', price: 117.8 },
		{ timestamp: '2023-05-15', price: 119.2 },
		{ timestamp: '2023-05-16', price: 121.5 },
		{ timestamp: '2023-05-17', price: 120.0 },
		{ timestamp: '2023-05-18', price: 122.75 },
		{ timestamp: '2023-05-19', price: 125.3 },
		{ timestamp: '2023-05-20', price: 127.6 }
	];

	let chartRef: HTMLCanvasElement;
	let chart;

	onMount(() => {
		const ctx = chartRef.getContext('2d');

		chart = new Chart(ctx, {
			type: 'candlestick',
			data: {
				labels: stockHistory.map((entry) => entry.timestamp),
				datasets: [
					{
						label: 'Stock Price',
						data: stockHistory.map((entry) => ({
							x: entry.timestamp,
							y: [entry.price, entry.price * 1.01, entry.price * 0.99, entry.price]
						})),
						borderColor: 'rgba(75, 192, 192, 1)',
						wickColor: 'rgba(75, 192, 192, 1)',
						borderWidth: 1
					}
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				scales: {
					x: {
						display: true,
						title: {
							display: true,
							text: 'Date'
						}
					},
					y: {
						display: true,
						title: {
							display: true,
							text: 'Price'
						},
						ticks: {
							callback: (value) => '$' + value.toFixed(2)
						}
					}
				},
				plugins: {
					tooltip: {
						mode: 'index',
						intersect: false,
						callbacks: {
							label: (context) => {
								const { o, h, l, c } = context.parsed;
								return `Open: $${o.toFixed(2)}, High: $${h.toFixed(2)}, Low: $${l.toFixed(2)}, Close: $${c.toFixed(2)}`;
							}
						}
					}
				}
			}
		});
	});
</script>

<div class="chart-container">
	<canvas bind:this={chartRef}></canvas>
</div>

<style>
	.chart-container {
		position: relative;
		width: 100%;
		height: 400px;
	}
</style>
