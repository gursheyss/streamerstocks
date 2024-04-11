<script lang="ts">
	import { onMount } from 'svelte';
	import Chart from 'chart.js/auto';

	interface StockData {
		timestamp: number;
		price: number;
	}

	let chartRef: HTMLCanvasElement;
	let stockData: StockData[] = [
		{ timestamp: 1617235200000, price: 100 },
		{ timestamp: 1617321600000, price: 110 },
		{ timestamp: 1617408000000, price: 95 },
		{ timestamp: 1617494400000, price: 105 },
		{ timestamp: 1617580800000, price: 120 },
		{ timestamp: 1617668000000, price: 130 },
		{ timestamp: 1617754400000, price: 115 },
		{ timestamp: 1617840800000, price: 100 },
		{ timestamp: 1617927200000, price: 118 },
		{ timestamp: 1618013600000, price: 125 },
		{ timestamp: 1618100000000, price: 130 },
		{ timestamp: 1618187200000, price: 120 },
		{ timestamp: 1618274400000, price: 115 },
		{ timestamp: 1618361600000, price: 125 },
		{ timestamp: 1618448000000, price: 130 },
		{ timestamp: 1618535200000, price: 120 },
		{ timestamp: 1618622400000, price: 125 },
		{ timestamp: 1618709600000, price: 130 },
		{ timestamp: 1618796800000, price: 120 },
		{ timestamp: 1618884000000, price: 125 },
		{ timestamp: 1618971200000, price: 130 },
		{ timestamp: 1619058400000, price: 120 },
		{ timestamp: 1619145600000, price: 125 },
		{ timestamp: 1619232800000, price: 130 },
		{ timestamp: 1619319200000, price: 120 },
		{ timestamp: 1619406400000, price: 125 },
		{ timestamp: 1619493600000, price: 130 },
		{ timestamp: 1619580800000, price: 120 },
		{ timestamp: 1619668000000, price: 125 },
		{ timestamp: 1619755200000, price: 130 },
		{ timestamp: 1619842400000, price: 120 },
		{ timestamp: 1619930000000, price: 125 },
		{ timestamp: 1620017600000, price: 130 },
		{ timestamp: 1620104800000, price: 120 },
		{ timestamp: 1620192000000, price: 125 },
		{ timestamp: 1620279200000, price: 130 },
		{ timestamp: 1620366400000, price: 120 },
		{ timestamp: 1620453600000, price: 125 },
		{ timestamp: 1620540800000, price: 130 },
		{ timestamp: 1620628000000, price: 120 },
		{ timestamp: 1620715200000, price: 125 },
		{ timestamp: 1620802400000, price: 130 },
		{ timestamp: 1620890000000, price: 120 }
	];

	let chart: Chart;
	let selectedRange: { start: number | null; end: number | null } = { start: null, end: null };

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
					labels: stockData.map((data) => new Date(data.timestamp).toLocaleDateString()),
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
								callback: (value: number) => value.toFixed(0)
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
									let label = context.dataset.label || '';
									if (label) {
										label += ': ';
									}
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
					},
					onHover: (event: MouseEvent, activeElements: any[]) => {
						if (activeElements.length === 0) {
							selectedRange = { start: null, end: null };
						}
					}
				}
			});

			chartRef.addEventListener('mousedown', handleMouseDown);
			chartRef.addEventListener('mouseup', handleMouseUp);
			chartRef.addEventListener('mousemove', handleMouseMove);
		}
	});

	function handleMouseDown(event: MouseEvent) {
		const points = chart.getElementsAtEventForMode(event, 'nearest', { intersect: true }, true);
		if (points.length) {
			const firstPoint = points[0];
			selectedRange.start = firstPoint.index;
		}
	}

	function handleMouseUp(event: MouseEvent) {
		const points = chart.getElementsAtEventForMode(event, 'nearest', { intersect: true }, true);
		if (points.length) {
			const firstPoint = points[0];
			selectedRange.end = firstPoint.index;
			calculateDifference();
		}
	}

	function handleMouseMove(event: MouseEvent) {
		if (selectedRange.start !== null && selectedRange.end === null) {
			const points = chart.getElementsAtEventForMode(event, 'nearest', { intersect: true }, true);
			if (points.length) {
				const firstPoint = points[0];
				selectedRange.end = firstPoint.index;
				calculateDifference();
			}
		}
	}

	function calculateDifference() {
		if (selectedRange.start !== null && selectedRange.end !== null) {
			const startPrice = stockData[selectedRange.start].price;
			const endPrice = stockData[selectedRange.end].price;
			const difference = endPrice - startPrice;
			const percentage = (difference / startPrice) * 100;

			console.log(`Price difference: $${difference.toFixed(2)} (${percentage.toFixed(2)}%)`);
		}
	}
</script>

<div class="container mx-auto mt-8">
	<div class="w-full h-96">
		<canvas bind:this={chartRef}></canvas>
	</div>
</div>
