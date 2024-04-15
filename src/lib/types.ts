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

export interface Comment {
	id: number;
	created_at: string;
	avatar_url: string | null;
	username: string | null;
	comment: string;
}
export interface Profile {
	rank?: number;
	user_id: string;
	username: string;
	avatar_url: string;
	net_worth: number;
	pnl: number;
	trade_count: number;
}

export interface Trade {
	trade_id: number;
	user_id: string;
	stock_id: number;
	bought_price: number;
	purchase_volume: number;
	date_purchased: Date;
	sold_price: number | null;
	sale_volume: number | null;
	status: 'bought' | 'sold' | 'pending';
}

export interface InventoryItem {
	id: number;
	user_id: number;
	stock_id: number;
	quantity: number;
	market: MarketItem;
}
