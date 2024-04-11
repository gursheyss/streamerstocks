from time import sleep
from analysis import *
from os import getenv

from supabase import create_client, Client

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
}

client: Client = create_client(getenv("SUPABASE_URL"), getenv("SUPABASE_API_KEY"))

def update_prices(delta_sentiment: dict):
    print('UPDATING PRICES')
    response = client.table('market').select('*').execute()
    response = list(response.data)

    for row in response:
        row['price'] += delta_sentiment[name_stock_mapping[row['name']] + '_delta']

    client.table('market').upsert(response).execute()

def update_prices_loop(interval_seconds=60):
    print('GETTING INITIAL SENTIMENT')
    previous_sentiment = get_posts_sentiment('jasontheweenie', analysis_group=['A2Guapo', 'Alex', 'Aliyah', 'Alyssa', 'BayBeeRae', 'VSB Dat', 'Effy', 'Ellen', 'Emily', 'Giaan', 'Irene', 'Jason', 'Jdab', 'Jes', 'Jess', 'Joy Mei', 'KC', 'Kaichu', 'Kailey', 'Keli', 'VSB Landon', 'Mariah', 'Mira', 'Prod', 'Raph', 'Sa', 'Santi', 'Selena', 'Ron', 'Sunny', 'VSB Tobi', 'YBG'], criteria=['body'], verbose=False)
    while True:
        sleep(interval_seconds)
        print('GETTING CURRENT SENTIMENT')
        current_sentiment = get_posts_sentiment('jasontheweenie', analysis_group=['A2Guapo', 'Alex', 'Aliyah', 'Alyssa', 'BayBeeRae', 'VSB Dat', 'Effy', 'Ellen', 'Emily', 'Giaan', 'Irene', 'Jason', 'Jdab', 'Jes', 'Jess', 'Joy Mei', 'KC', 'Kaichu', 'Kailey', 'Keli', 'VSB Landon', 'Mariah', 'Mira', 'Prod', 'Raph', 'Sa', 'Santi', 'Selena', 'Ron', 'Sunny', 'VSB Tobi', 'YBG'], criteria=['body'], verbose=False)
        delta_sentiment = {}
        for key in set(previous_sentiment.keys()):
            delta_sentiment[key.replace("_sentiment", "_delta")] = current_sentiment[key] - previous_sentiment[key]
        update_prices(delta_sentiment)
        previous_sentiment = dict(current_sentiment)


if __name__ == "__main__":
    update_prices_loop(interval_seconds=30)