import time
from os import getenv
import threading
import requests

from supabase import create_client, Client

from analyzers.reddit import *
from analyzers.twitch import analyze_chat_batch
from webhook import send_market_update, send_error_message

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
    "Ba": "ba",
    "Malik": "malik",
    "Arky": "arky"
}
# List of users to analyze sentiment for
analysis_group =['A2Guapo', 'Alex', 'Aliyah', 'Alyssa', 'Arky', 'Ba', 'BayBeeRae', 'VSB Dat', 'Effy', 'Ellen', 'Emily', 'Giaan', 'Irene', 'Jason', 'Jdab', 'Jes', 'Jess', 'Joy Mei', 'KC', 'Kaichu', 'Kailey', 'Keli', 'VSB Landon', 'Malik', 'Mariah', 'Mira', 'Prod', 'Raph', 'Sa', 'Santi', 'Selena', 'Ron', 'Sunny', 'VSB Tobi', 'YBG', 'Yugi']
# Cache of stock prices, used to check if the price has changed
stock_price_cache = {}
# Whether Jason is online, determines whether to analyze Twitch chat or Reddit
jason_online = False

# Supabase client
client: Client = create_client(getenv("PUBLIC_SUPABASE_URL"), getenv("PUBLIC_SUPABASE_ANON_KEY"))

def update_prices(delta_sentiment:dict, scalar:float=1.0) -> None:
    '''Update the prices of stocks based on the change in sentiment (delta sentiment) scaled by a scalar (default 0.5)'''
    print('UPDATING PRICES')
    response = client.table('market').select('*').execute()
    response = list(response.data)
    send_market_update(response, delta_sentiment, scalar)
    for row in response:
        if row['name'] in name_stock_mapping:
            row['price'] += (scalar * (delta_sentiment.get(name_stock_mapping[row['name']] + '_delta', 0) * (row['price']/100)))
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

def update_by_chat_loop(max_batch_size:int=40) -> None:
    '''Update prices based on Twitch chat on an interval if Jason is online'''
    print("Starting Twitch chat analysis loop\n******************************\n")
    while True:
        try:
            if jason_online:
                print("Analyzing chat:")
                # Spend half the time analyzing chat, and the other half updating prices
                sentiment = analyze_chat_batch(max_batch_size, keywords=([name.lower() for name in analysis_group] + ['kelly', 'gian', 'vsb']), analysis_group=analysis_group)
                for key in set(sentiment.keys()):
                    sentiment[key.replace("_sentiment", "_delta")] = sentiment[key]
                update_prices(sentiment, scalar=1)
            time.sleep(1)
        except:
            send_error_message("Error analyzing Twitch chat")

def update_by_reddit_loop(update_interval_seconds:int=300) -> None:
    '''Update prices based on Reddit if Jason is offline'''
    print("Starting Reddit analysis loop\n******************************\n")
    previous_sentiment = get_posts_sentiment('jasontheweenie', analysis_group=analysis_group, criteria=['body'], verbose=False)
    while True:
        try:
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
        except:
            send_error_message("Error analyzing Reddit")

def check_if_jason_online() -> None:
    '''Check if Jason is online every 5 minutes and update the global variable jason_online accordingly'''
    global jason_online
    while True:
        try:
            contents = requests.get('https://www.twitch.tv/jasontheween').content.decode('utf-8')
            if 'isLiveBroadcast' in contents:
                jason_online = True
                print("Jason is online")
            else:
                jason_online = False
                print("Jason is offline")
            time.sleep(300)
        except:
            send_error_message("Error checking if Jason is online")

def save_history_loop(decay_rate:float=0.001, save_interval_seconds:int=60) -> None:
    '''Save the prices to their history every "save_interval_seconds" seconds'''
    decay_delta = {}
    for person in analysis_group:
        decay_delta[person.lower().replace(" ", "") + "_delta"] = -1
    while True:
        try:
            current_time = int(time.time())
            if current_time % save_interval_seconds == 0:
                update_prices(decay_delta, scalar=decay_rate)
                save_prices_to_history()
            time.sleep(1)
        except:
            send_error_message("Error saving history")

if __name__ == "__main__":
    print("Starting the market mover....")
    online_thread = threading.Thread(target=check_if_jason_online)
    chat_update_thread = threading.Thread(target=update_by_chat_loop)
    reddit_update_thread = threading.Thread(target=update_by_reddit_loop)
    save_thread = threading.Thread(target=save_history_loop)

    online_thread.start()
    chat_update_thread.start()
    reddit_update_thread.start()
    save_thread.start()

    online_thread.join()
    chat_update_thread.join()
    reddit_update_thread.join()
    save_thread.join()