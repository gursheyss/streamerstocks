<script lang="ts">
	import { onMount } from 'svelte';
	import { Chart, registerables } from 'chart.js';

	interface HistoryItem {
		timestamp: number;
		price: number;
	}

	interface HistoryData {
		priceData: HistoryItem[];
	}

	// let { priceData }: { priceData: { timestamp: number; price: number } }[] = $props();

	let priceData = [
		{
			timestamp: 1620000000000,
			price: 100
		},
		{
			timestamp: 1620000001000,
			price: 110
		},
		{
			timestamp: 1620000002000,
			price: 120
		},
		{
			timestamp: 1620000003000,
			price: 130
		},
		{
			timestamp: 1620000004000,
			price: 140
		},
		{
			timestamp: 1620000005000,
			price: 150
		},
		{
			timestamp: 1620000006000,
			price: 160
		},
		{
			timestamp: 1620000007000,
			price: 170
		},
		{
			timestamp: 1620000008000,
			price: 180
		},
		{
			timestamp: 1620000009000,
			price: 190
		},
		{
			timestamp: 1620000010000,
			price: 200
		},
		{
			timestamp: 1620000011000,
			price: 210
		},
		{
			timestamp: 1620000012000,
			price: 220
		},
		{
			timestamp: 1620000013000,
			price: 230
		},
		{
			timestamp: 1620000014000,
			price: 240
		},
		{
			timestamp: 1620000015000,
			price: 250
		},
		{
			timestamp: 1620000016000,
			price: 260
		},
		{
			timestamp: 1620000017000,
			price: 270
		},
		{
			timestamp: 1620000018000,
			price: 280
		},
		{
			timestamp: 1620000019000,
			price: 290
		},
		{
			timestamp: 1620000020000,
			price: 300
		},
		{
			timestamp: 1620000021000,
			price: 310
		}
	];

	let chart: Chart;

	let chartRef: HTMLCanvasElement;
	const chartOptions = {
		responsive: true,
		maintainAspectRatio: false,
		scales: {
			x: {
				type: 'time',
				time: {
					unit: 'day'
				},
				grid: {
					color: '#2d3748',
					borderColor: '#4a5568'
				},
				ticks: {
					color: '#cbd5e0'
				}
			},
			y: {
				grid: {
					color: '#2d3748',
					borderColor: '#4a5568'
				},
				ticks: {
					color: '#cbd5e0'
				}
			}
		},
		elements: {
			point: {
				radius: 0
			},
			line: {
				tension: 0.4,
				borderWidth: 2,
				borderColor: '#63b3ed'
			}
		},
		plugins: {
			legend: {
				display: false
			},
			tooltip: {
				displayColors: false,
				callbacks: {
					label: (context) => `$${context.parsed.y}`
				}
			}
		}
	};

	onMount(() => {
		Chart.register(...registerables);
		chart = new Chart(chartRef, {
			type: 'line',
			data: {
				datasets: [
					{
						data: priceData.map((data) => ({ x: data.timestamp, y: data.price }))
					}
				]
			},
			options: chartOptions
		});
	});
</script>

<div class="w-full h-96 bg-gray-900 rounded-lg shadow-lg p-4">
	<canvas bind:this={chartRef} />
</div>
