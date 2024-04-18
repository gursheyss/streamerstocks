import { redis } from './redis';

// ... existing code ...

redis
	.del('marketData19')
	.then(() => {
		console.log('Key marketData19 deleted');
	})
	.catch((err) => {
		console.error('Error deleting key marketData19:', err);
	});

// ... existing code ...
