export interface MarketItem {
	id: string;
	name: string;
	ticker: string;
	price: number;
	low: number;
	high: number;
	market_cap: number;
	volume: number;
	image: string;
	history: MarketItemHistory[];
}

interface MarketItemHistory {
	timestamp: number;
	price: number;
}
