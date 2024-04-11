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

export interface MarketItemHistory {
	timestamp: number;
	price: number;
}

export interface InventoryItem {
	id: number,
	user_id: number,
	stock_id: number,
	quantity: number,
	market: MarketItem
}
