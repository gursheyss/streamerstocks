import random
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
    "Keli": "kelly",
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
    "Landon": "landon",
    "Dat": "dat",
    "Tobi": "tobi",
    "Yugi": "yugi",
    "Ba": "ba",
    "Malik": "malik",
    "Arky": "arky",
    "Nosiiree": "nosiiree",
    "Redify": "redify",
    "Edward": "edward",
    "MrLazerboy": "lazerboy"
}

# List of users to analyze sentiment for
analysis_group = ['A2Guapo', 'Alex', 'Aliyah', 'Alyssa', 'Arky', 'Ba', 'BayBeeRae', 'Dat', 'Edward', 'Effy', 'Ellen', 'Emily', 'Giaan', 'Irene', 'Jason', 'Jdab', 'Jes', 'Jess', 'Joy Mei', 'KC', 'Kaichu', 'Kailey', 'Kelly', 'Landon', 'Lazerboy', 'Malik', 'Mariah', 'Mira', 'Nosiiree', 'Prod', 'Raph', 'Redify', 'Sa', 'Santi', 'Selena', 'Ron', 'Sunny', 'Tobi', 'YBG', 'Yugi']

# Whether Jason is online, determines whether to analyze Twitch chat or Reddit
jason_online = False

# Supabase client
client: Client = create_client(getenv("PUBLIC_SUPABASE_URL"), getenv("SUPABASE_SERVICE_KEY"))

def update_prices(delta_sentiment:dict, scalar:float) -> None:
    '''Update the prices of stocks based on the change in sentiment (delta sentiment) scaled by a scalar (default 0.5)'''
    print('UPDATING PRICES')
    response = list(client.table('market').select('*').execute().data)
    send_market_update(response, delta_sentiment, scalar)
    for row in response:
        if row['name'] in name_stock_mapping:
            percent_delta = (delta_sentiment.get(name_stock_mapping[row['name']] + '_delta', 0) * (row['price']/100))
            if percent_delta != 0:
                row['price'] += (scalar * percent_delta)
            else:
                row['price'] += row['price'] * random.uniform(-0.005, 0.005)
    client.table('market').upsert(response).execute()

def save_prices_to_history(decay_rate:float) -> None:
    '''Save the current prices of stocks to their history. Does not save to history if the price has not changed.'''
    try:
        print('SAVING PRICES')
        client.rpc('decay_and_save_snapshots', {'decay_rate': decay_rate}).execute()
    except:
        raise Exception()

def update_by_chat_loop(max_batch_size:int, scalar:float, exit_event:threading.Event) -> None:
    '''Update prices based on Twitch chat on an interval if Jason is online'''
    print("Starting Twitch chat analysis loop\n******************************\n")
    while not exit_event.is_set():
        try:
            if jason_online:
                print("Analyzing chat:")
                # Spend half the time analyzing chat, and the other half updating prices
                sentiment = analyze_chat_batch(max_batch_size, keywords=([name.lower() for name in analysis_group]), analysis_group=analysis_group)
                for key in set(sentiment.keys()):
                    sentiment[key.replace("_sentiment", "_delta")] = sentiment[key]
                update_prices(sentiment, scalar=scalar)
            time.sleep(1)
        except:
            send_error_message("Error analyzing Twitch chat")
            exit_event.set()

def update_by_reddit_loop(update_interval_seconds:int, scalar:float, exit_event:threading.Event) -> None:
    '''Update prices based on Reddit if Jason is offline'''
    print("Starting Reddit analysis loop\n******************************\n")
    previous_sentiment = get_posts_sentiment('jasontheweenie', analysis_group=analysis_group, criteria=['body'], verbose=False)
    while not exit_event.is_set():
        try:
            if not jason_online:
                current_time = int(time.time())
                if current_time % update_interval_seconds == 0:
                    print("Analyzing Reddit:")
                    current_sentiment = get_posts_sentiment('jasontheweenie', analysis_group=analysis_group, criteria=['body'], verbose=False)
                    delta_sentiment = {}
                    for key in set(previous_sentiment.keys()):
                        delta_sentiment[key.replace("_sentiment", "_delta")] = current_sentiment[key] - previous_sentiment[key]
                    update_prices(delta_sentiment, scalar=scalar) # Funny number to make numbers seem more random
                    previous_sentiment = dict(current_sentiment)
            time.sleep(1)
        except:
            send_error_message("Error analyzing Reddit")
            exit_event.set()

def check_if_jason_online(exit_event:threading.Event) -> None:
    '''Check if Jason is online every 5 minutes and update the global variable jason_online accordingly'''
    global jason_online
    while not exit_event.is_set():
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
            exit_event.set()

def save_snapshot_loop(save_interval_seconds:int, decay_rate:float, exit_event:threading.Event) -> None:
    '''Save the prices to their history every "save_interval_seconds" seconds'''
    decay_delta = {}
    for person in analysis_group:
        decay_delta[person.lower().replace(" ", "") + "_delta"] = -1
    while not exit_event.is_set():
        try:
            current_time = int(time.time())
            if current_time % save_interval_seconds == 0:
                save_prices_to_history(decay_rate)
            time.sleep(1)
        except:
            send_error_message("Error saving history")
            exit_event.set()

if __name__ == "__main__":
    exit_event = threading.Event()

    print("Starting the market mover....")
    online_thread = threading.Thread(target=check_if_jason_online, kwargs={'exit_event': exit_event})
    chat_update_thread = threading.Thread(target=update_by_chat_loop, kwargs={'max_batch_size': 50, 'scalar': 0.4812, 'exit_event': exit_event})
    reddit_update_thread = threading.Thread(target=update_by_reddit_loop, kwargs={'update_interval_seconds': 600, 'scalar': 0.2047, 'exit_event': exit_event})
    save_thread = threading.Thread(target=save_snapshot_loop, kwargs={'save_interval_seconds': 60, 'decay_rate': 0.0000244, 'exit_event': exit_event}) # -10% every 3 days

    online_thread.start()
    chat_update_thread.start()
    reddit_update_thread.start()
    save_thread.start()

    online_thread.join()
    chat_update_thread.join()
    reddit_update_thread.join()
    save_thread.join()