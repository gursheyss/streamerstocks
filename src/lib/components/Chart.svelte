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

	onMount(() => {
		const ctx = chartRef.getContext('2d');
		if (ctx) {
			const isIncreasing = stockData[stockData.length - 1].price > stockData[0].price;
			const gradientColor = isIncreasing ? 'rgba(0, 255, 0, 0.2)' : 'rgba(255, 0, 0, 0.5)';

			const prices = stockData.map((data) => data.price);
			const minPrice = Math.floor(Math.min(...prices) - 2);
			const maxPrice = Math.ceil(Math.max(...prices) + 2);

			chart = new Chart(ctx, {
				type: 'line',
				data: {
					labels: stockData.map((data) => new Date(data.timestamp * 1000).toLocaleTimeString()),
					datasets: [
						{
							data: stockData.map((data) => data.price),
							borderColor: isIncreasing ? 'green' : 'red',
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
						y: {
							min: minPrice,
							max: maxPrice,
							ticks: {
								stepSize: 1,
								callback: (tickValue: number | string) => {
									if (typeof tickValue === 'number') {
										return tickValue.toFixed(0);
									}
									return tickValue;
								}
							},
							grid: {
								color: 'rgba(255, 255, 255, 0.1)',
								borderDash: [5, 5],
								drawBorder: false,
								drawTicks: false
							}
						}
					},
					plugins: {
						legend: {
							display: false
						},
						tooltip: {
							callbacks: {
								label: (context: any) => {
									let label = '';
									if (context.parsed.y !== null) {
										label += '$' + context.parsed.y.toFixed(2);
									}

									return label;
								}
							},
							displayColors: false,
							titleFont: {
								family: 'Inter'
							},
							bodyFont: {
								family: 'Inter'
							},
							footerFont: {
								family: 'Inter'
							}
						}
					},
					interaction: {
						intersect: false,
						mode: 'nearest'
					}
				}
			});
			window.addEventListener('resize', updateChart);
			updateChart();
			chart.resize();
		}
	});

	function handleHover(event: MouseEvent) {
		const points = chart.getElementsAtEventForMode(event, 'nearest', { intersect: true }, true);
		if (points.length) {
			const firstPoint = points[0];
			const data = stockData[firstPoint.index];
			// Display the data and vertical line on hover
			// You can customize this based on your requirements
			console.log(
				`Price: ${data.price}, Date: ${new Date(data.timestamp * 1000).toLocaleDateString()}`
			);
		}
	}

	function updateChart() {
		const isIncreasing = stockData[stockData.length - 1].price > stockData[0].price;
		const gradientColor = isIncreasing ? 'rgba(0, 255, 0, 0.2)' : 'rgba(255, 0, 0, 0.5)';
		const prices = stockData.map((data) => data.price);
		const minPrice = Math.min(...prices);
		const maxPrice = Math.max(...prices);
		const padding = (maxPrice - minPrice) * 0.1; // Add 10% padding

		chart.data.labels = stockData.map((data) =>
			new Date(data.timestamp * 1000).toLocaleTimeString()
		);

		chart.data.datasets[0].data = stockData.map((data) => data.price);
		chart.data.datasets[0].borderColor = isIncreasing ? 'green' : 'red';
		chart.options.scales.y.min = minPrice - padding;
		chart.options.scales.y.max = maxPrice + padding;

		chart.resize();
		chart.update('none');
	}

	$effect(() => {
		if (stockData) {
			updateChart();
		}
	});
</script>

<div class="container mx-auto mt-8">
	<div class="w-full">
		<canvas bind:this={chartRef} on:mousemove={handleHover}></canvas>
	</div>
</div>
