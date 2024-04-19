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
					animation: {
						duration: 1000, // duration of the animation in milliseconds
						easing: 'easeOutExpo' // easing function to use
					},
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
								},
								autoSkip: false,
								maxTicksLimit: 5
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
			// console.log(
			// 	`Price: ${data.price}, Date: ${new Date(data.timestamp * 1000).toLocaleDateString()}`
			// );
		}
	}

	function updateChart() {
		const isIncreasing = stockData[stockData.length - 1].price > stockData[0].price;
		const isStraightLine =
			stockData.length === 1 || stockData.every((data) => data.price === stockData[0].price);
		const gradientColor = isStraightLine
			? 'rgba(128, 128, 128, 0.2)'
			: isIncreasing
				? 'rgba(0, 255, 0, 0.2)'
				: 'rgba(255, 0, 0, 0.5)';

		const prices = stockData.map((data) => data.price);
		const minPrice = Math.min(...prices);
		const maxPrice = Math.max(...prices);

		// Add a small buffer to the min and max prices if they are equal
		const buffer = 0.1;
		const yMin = minPrice === maxPrice ? minPrice - buffer : minPrice;
		const yMax = minPrice === maxPrice ? maxPrice + buffer : maxPrice;

		const padding = (yMax - yMin) * 0.1; // Add 10% padding

		// Ensure the chart's canvas context is available
		if (chart.ctx) {
			const { ctx, chartArea } = chart;
			const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
			gradient.addColorStop(0, gradientColor);
			gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

			// Apply the new gradient
			chart.data.datasets[0].fill = { target: 'origin', above: gradient };
		}

		// Handle the case when there is only one data point
		if (stockData.length === 1) {
			const timestamp = stockData[0].timestamp;
			const price = stockData[0].price;
			chart.data.labels = [
				new Date(timestamp * 1000 - 60000).toLocaleTimeString(), // Add an artificial timestamp 1 minute before
				new Date(timestamp * 1000).toLocaleTimeString()
			];
			chart.data.datasets[0].data = [price, price]; // Duplicate the price for both timestamps
		} else {
			chart.data.labels = stockData.map((data) =>
				new Date(data.timestamp * 1000).toLocaleTimeString()
			);
			chart.data.datasets[0].data = stockData.map((data) => data.price);
		}

		chart.data.datasets[0].borderColor = isStraightLine ? 'grey' : isIncreasing ? 'green' : 'red';
		chart.options.scales.y.min = yMin - padding;
		chart.options.scales.y.max = yMax + padding;

		chart.resize();

		chart.update();
	}

	$effect(() => {
		if (stockData) {
			updateChart();
		}
	});
</script>

<div class="container mt-8">
	<div class="w-full">
		<canvas bind:this={chartRef} on:mousemove={handleHover}></canvas>
	</div>
</div>
