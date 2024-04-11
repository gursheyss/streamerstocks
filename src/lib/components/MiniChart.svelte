<script lang="ts">
	import { onMount } from 'svelte';
	import Chart from 'chart.js/auto';

	interface StockData {
		timestamp: number;
		price: number;
	}

	let chartRef: HTMLCanvasElement;
	let { stockData }: { stockData: StockData[] } = $props();
	let chart: Chart;

	onMount(() => {
		const ctx = chartRef.getContext('2d');
		if (ctx) {
			createChart(ctx);
		}
	});

	function createChart(ctx: CanvasRenderingContext2D) {
		const startPrice = stockData[0].price;
		const endPrice = stockData[stockData.length - 1].price;
		const priceChange = endPrice - startPrice;
		const isIncreasing = priceChange > 0;
		const gradientColor = isIncreasing
			? 'rgba(0, 255, 0, 0.2)'
			: priceChange < 0
				? 'rgba(255, 0, 0, 0.5)'
				: 'rgba(128, 128, 128, 0.2)';
		const chartData = stockData.length === 1 ? [stockData[0], stockData[0]] : stockData;
		const lineColor = isIncreasing ? 'green' : priceChange < 0 ? 'red' : 'gray';

		chart = new Chart(ctx, {
			type: 'line',
			data: {
				labels: chartData.map(() => ''),
				datasets: [
					{
						data: chartData.map((data) => data.price),
						borderColor: lineColor,
						fill: {
							target: 'origin',
							above: (context: any) => {
								const chart = context.chart;
								const { ctx, chartArea } = chart;
								if (!chartArea) {
									return null;
								}
								const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
								gradient.addColorStop(0, gradientColor);
								gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
								return gradient;
							}
						},
						tension: 0.1,
						pointRadius: 0
					}
				]
			},
			options: {
				responsive: true,
				scales: {
					x: { display: false },
					y: { display: false }
				},
				plugins: {
					legend: { display: false },
					tooltip: { enabled: false }
				}
			}
		});
	}

	function updateChart() {
		const startPrice = stockData[0].price;
		const endPrice = stockData[stockData.length - 1].price;
		const priceChange = endPrice - startPrice;
		const isIncreasing = priceChange > 0;
		const gradientColor = isIncreasing
			? 'rgba(0, 255, 0, 0.2)'
			: priceChange < 0
				? 'rgba(255, 0, 0, 0.5)'
				: 'rgba(128, 128, 128, 0.2)';
		const chartData = stockData.length === 1 ? [stockData[0], stockData[0]] : stockData;
		const lineColor = isIncreasing ? 'green' : priceChange < 0 ? 'red' : 'gray';

		chart.data.datasets[0].data = chartData.map((data) => data.price);
		chart.data.datasets[0].borderColor = lineColor;
		chart.data.datasets[0].fill.above = (context: any) => {
			const chart = context.chart;
			const { ctx, chartArea } = chart;
			if (!chartArea) {
				return null;
			}
			const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
			gradient.addColorStop(0, gradientColor);
			gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
			return gradient;
		};
		chart.update();
	}

	$effect(() => {
		if (chart) {
			updateChart();
		}
	});
</script>

<div class="container mx-auto mt-8">
	<div class="w-full h-96">
		<canvas bind:this={chartRef}></canvas>
	</div>
</div>
