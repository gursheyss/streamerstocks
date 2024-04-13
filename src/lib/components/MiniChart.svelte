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
			downsampledData = downsampleData(stockData, 10); // Downsample data to 100 points
			createChart(ctx);
		}
	});

	function createChart(ctx: CanvasRenderingContext2D) {
		const prices = downsampledData.map((data) => data.price);
		const minPrice = Math.min(...prices);
		const maxPrice = Math.max(...prices);
		const padding = (maxPrice - minPrice) * 0.1;

		chart = new Chart(ctx, {
			type: 'line',
			data: {
				labels: downsampledData.map(() => ''),
				datasets: [
					{
						data: prices,
						borderColor: 'green',
						fill: false,
						tension: 0.1,
						pointRadius: 0
					}
				]
			},
			options: {
				responsive: true,
				animation: false,
				scales: {
					y: {
						display: false,
						min: minPrice - padding,
						max: maxPrice + padding
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
		const padding = (maxPrice - minPrice) * 0.1; // Add 10% padding

		chart.data.labels = downsampledData.map(() => '');
		chart.data.datasets[0].data = downsampledData.map((data) => data.price);
		chart.data.datasets[0].borderColor = isIncreasing ? 'green' : 'red';
		chart.options.scales.y.min = minPrice - padding;
		chart.options.scales.y.max = maxPrice + padding;

		chart.resize();
		chart.update('none');
	}

	$effect(() => {
		if (stockData && chart) {
			downsampledData = downsampleData(stockData, 10); // Downsample data to 100 points
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
