import time
from os import getenv
import threading
import requests

from supabase import create_client, Client

from analyzers.reddit import *
from analyzers.twitch import analyze_chat_batch

# Mapping of user names to their names in sentiment analysis JSON
name_stock_mapping = {
    "Jason": "jason",
    "BayBeeRae": "baybeerae",
    "Jessica (OC)": "jess",
    "Jess (RP)": "jes",
    "Mira": "mira",
    "KC": "kc",
    "Alyssa": "alyssa",
    "Emily": "emily",
    "Raph": "raph",
    "YBG": "ybg",
    "Santi": "santi",
    "Selena": "selena",
    "Keli": "keli",
    "Giaan": "giaan",
    "Effy": "effy",
    "Mariah": "mariah",
    "Prod": "prod",
    "Joy Mei": "joymei",
    "Stable Ronaldo": "ron",
    "Irene": "irene",
    "Alex": "alex",
    "Kailey": "kailey",
    "A2Guapo": "a2guapo",
    "Sa": "sa",
    "Sunny": "sunny",
    "Aliyah": "aliyah",
    "Ellen": "ellen",
    "Kaichu": "kaichu",
    "Jdab": "jdab",
    "Landon": "vsblandon",
    "Dat": "vsbdat",
    "Tobi": "vsbtobi",
    "Yugi": "yugi",
    "Ba": "ba"
}
# List of users to analyze sentiment for
analysis_group =['A2Guapo', 'Alex', 'Aliyah', 'Alyssa', 'Ba', 'BayBeeRae', 'VSB Dat', 'Effy', 'Ellen', 'Emily', 'Giaan', 'Irene', 'Jason', 'Jdab', 'Jes', 'Jess', 'Joy Mei', 'KC', 'Kaichu', 'Kailey', 'Keli', 'VSB Landon', 'Mariah', 'Mira', 'Prod', 'Raph', 'Sa', 'Santi', 'Selena', 'Ron', 'Sunny', 'VSB Tobi', 'YBG', 'Yugi']
# Cache of stock prices, used to check if the price has changed
stock_price_cache = {}
# Whether Jason is online, determines whether to analyze Twitch chat or Reddit
jason_online = False

# Supabase client
client: Client = create_client(getenv("PUBLIC_SUPABASE_URL"), getenv("PUBLIC_SUPABASE_ANON_KEY"))

def update_prices(delta_sentiment:dict, scalar:float=0.5) -> None:
    '''Update the prices of stocks based on the change in sentiment (delta sentiment) scaled by a scalar (default 0.5)'''
    print('UPDATING PRICES')
    response = client.table('market').select('*').execute()
    response = list(response.data)
    for row in response:
        if row['name'] in name_stock_mapping:
            row['price'] += (delta_sentiment.get(name_stock_mapping[row['name']] + '_delta', 0) * (row['price']/100))
    client.table('market').upsert(response).execute()

def save_prices_to_history() -> None:
    '''Save the current prices of stocks to their history. Does not save to history if the price has not changed.'''
    print('SAVING PRICES')
    response = client.table('market').select('*').execute()
    response = response.data
    current_timestamp = int(datetime.now().timestamp())
    # Update the history of each stock
    for row in response:
        # If stock is in cache
        if row['id'] in stock_price_cache:
            # If the stock price has changed, update the history
            if row['price'] != stock_price_cache[row['id']]:
                stock_price_cache[row['id']] = row['price']
                row['history'].append({
                    'timestamp': current_timestamp,
                    'price': row['price']
                })
        # If stock is not in cache, add it to the cache and update the history
        else:
            stock_price_cache[row['id']] = row['price']
            row['history'].append({
                'timestamp': current_timestamp,
                'price': row['price']
            })
            
    client.table('market').upsert(response).execute()

def update_by_chat_loop(update_interval_seconds:int=120) -> None:
    '''Update prices based on Twitch chat on an interval if Jason is online'''
    print("Starting Twitch chat analysis loop\n******************************\n")
    while True:
        if jason_online:
            if int(time.time()) % update_interval_seconds == 0:
                print("Analyzing chat:")
                # Spend half the time analyzing chat, and the other half updating prices
                sentiment = analyze_chat_batch(update_interval_seconds//2, keywords=[name.lower() for name in analysis_group], analysis_group=analysis_group)
                for key in set(sentiment.keys()):
                    sentiment[key.replace("_sentiment", "_delta")] = sentiment[key]
                update_prices(sentiment)
        time.sleep(1)

def update_by_reddit_loop(update_interval_seconds:int=600) -> None:
    '''Update prices based on Reddit if Jason is offline'''
    print("Starting Reddit analysis loop\n******************************\n")
    previous_sentiment = get_posts_sentiment('jasontheweenie', analysis_group=analysis_group, criteria=['body'], verbose=False)
    while True:
        if not jason_online:
            current_time = int(time.time())
            if current_time % update_interval_seconds == 0:
                print("Analyzing Reddit:")
                current_sentiment = get_posts_sentiment('jasontheweenie', analysis_group=analysis_group, criteria=['body'], verbose=False)
                delta_sentiment = {}
                for key in set(previous_sentiment.keys()):
                    delta_sentiment[key.replace("_sentiment", "_delta")] = current_sentiment[key] - previous_sentiment[key]
                update_prices(delta_sentiment)
                previous_sentiment = dict(current_sentiment)
        time.sleep(1)

def check_if_jason_online() -> None:
    '''Check if Jason is online every 5 minutes and update the global variable jason_online accordingly'''
    global jason_online
    while True:
        contents = requests.get('https://www.twitch.tv/jasontheween').content.decode('utf-8')
        if 'isLiveBroadcast' in contents:
            jason_online = True
            print("Jason is online")
        else:
            jason_online = False
            print("Jason is offline")
        time.sleep(300)

def save_history_loop(save_interval_seconds:int=60) -> None:
    '''Save the prices to their history every "save_interval_seconds" seconds'''
    while True:
        current_time = int(time.time())
        if current_time % save_interval_seconds == 0:
            save_prices_to_history()
        time.sleep(1)

if __name__ == "__main__":
    online_thread = threading.Thread(target=check_if_jason_online)
    chat_update_thread = threading.Thread(target=update_by_chat_loop, args=(60,))
    reddit_update_thread = threading.Thread(target=update_by_reddit_loop, args=(300,))
    save_thread = threading.Thread(target=save_history_loop, args=(60,))

    online_thread.start()
    chat_update_thread.start()
    reddit_update_thread.start()
    save_thread.start()

    online_thread.join()
    chat_update_thread.join()
    reddit_update_thread.join()
    save_thread.join()