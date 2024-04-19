<!-- src/routes/portfolio/index.svelte -->
<script>
  let stocks = [
    { symbol: 'AAPL', price: 123.45, change: '+2.34', changePercent: '+1.2%' },
    // ... other stock data
  ];

  // Add any additional script logic you need here
</script>

<style>

</style>

<div class="bg-base-200 min-h-screen">
  <!-- Content -->
  <div class="flex flex-col lg:flex-row">
    <!-- Total Portfolio Value Card -->
    <div class="card w-full bg-base-100 shadow-xl m-2">
      <div class="card-body">
        <h2 class="card-title">Total Portfolio Value</h2>
        <p>$12,345.67</p>
        <p>+20.1% from last month</p>
      </div>
    </div>

    <!-- Total Holdings Card -->
    <div class="card w-full bg-base-100 shadow-xl m-2">
      <div class="card-body">
        <h2 class="card-title">Total Holdings</h2>
        <p>5</p>
        <p>+180.1% from last month</p>
      </div>
    </div>
  </div>

  <!-- Search Stocks Card -->
  <div class="card w-full bg-base-100 shadow-xl m-2">
    <div class="card-body">
      <h2 class="card-title">Search Stocks</h2>
      <div class="form-control">
        <div class="input-group">
          <input type="text" placeholder="Enter a stock symbol" class="input input-bordered input-primary w-full max-w-xs" />
          <button class="btn btn-primary">Search</button>
        </div>
      </div>
    </div>
  </div>

  <!-- My Portfolio Table -->
  <!-- Repeat the card structure for your portfolio items -->
</div>