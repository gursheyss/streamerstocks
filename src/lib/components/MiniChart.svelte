<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import Chart from 'chart.js/auto';

	interface StockData {
		timestamp: number;
		price: number;
	}

	let chartRef: HTMLCanvasElement;
	let { stockData }: { stockData: StockData[] } = $props();
	let chart: Chart;
	let downsampledData: StockData[];

	onMount(() => {
		const ctx = chartRef.getContext('2d');
		if (ctx) {
			downsampledData = stockData;
			createChart(ctx);
		}
	});

	function createChart(ctx: CanvasRenderingContext2D) {
		const prices = downsampledData.map((data) => data.price);
		const minPrice = Math.min(...prices);
		const maxPrice = Math.max(...prices);
		const padding = maxPrice - minPrice;

		chart = new Chart(ctx, {
			type: 'line',
			data: {
				labels: downsampledData.map(() => ''),
				datasets: [
					{
						data: prices,
						borderColor: 'green',
						fill: {
							target: 'origin',
							above: (context: any) => {
								const chart = context.chart;
								const { ctx, chartArea } = chart;
								if (!chartArea) {
									return null;
								}
								const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
								gradient.addColorStop(0, 'rgba(0, 255, 0, 0.2)');
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
				animation: {
					duration: 1000,
					easing: 'easeInOutQuad'
				},
				scales: {
					y: {
						display: false,
						min: minPrice,
						max: maxPrice
					}
				},
				plugins: {
					legend: { display: false },
					tooltip: { enabled: false }
				}
			}
		});
	}

	function updateChart() {
		const isIncreasing =
			downsampledData[downsampledData.length - 1].price > downsampledData[0].price;
		const prices = downsampledData.map((data) => data.price);
		const minPrice = Math.min(...prices);
		const maxPrice = Math.max(...prices);
		const padding = maxPrice - minPrice; // Add 10% padding

		chart.data.labels = downsampledData.map(() => '');
		chart.data.datasets[0].data = downsampledData.map((data) => data.price);
		chart.data.datasets[0].borderColor = isIncreasing ? 'green' : 'red';
		chart.data.datasets[0].fill = {
			target: 'origin',
			above: (context: any) => {
				const chart = context.chart;
				const { ctx, chartArea } = chart;
				if (!chartArea) {
					return null;
				}
				const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
				gradient.addColorStop(0, isIncreasing ? 'rgba(0, 255, 0, 0.2)' : 'rgba(255, 0, 0, 0.2)');
				gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
				return gradient;
			}
		};
		chart.options.scales.y.min = minPrice;
		chart.options.scales.y.max = maxPrice;

		chart.resize();
		chart.update(); // Update the chart with animations
	}

	$effect(() => {
		if (stockData && chart) {
			downsampledData = downsampleData(stockData, 100); // Downsample data to 100 points
			updateChart();
		}
	});

	function downsampleData(data: StockData[], targetPoints: number): StockData[] {
		if (data.length <= targetPoints) {
			return data;
		}
		const ratio = Math.floor(data.length / targetPoints);
		return data.filter((_, index) => index % ratio === 0);
	}
</script>

<div class="container mx-auto mt-8">
	<div class="w-full">
		<canvas bind:this={chartRef}></canvas>
	</div>
</div>
