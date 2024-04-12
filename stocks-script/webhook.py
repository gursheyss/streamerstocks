from os import getenv

from datetime import datetime
from discordwebhook import Webhook, Embed

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

discord = Webhook(url=getenv("DISCORD_WEBHOOK_URL"))

def send_market_update(original_stock_data:list, delta_stock_data:dict, scalar:float):
    description = "The market has been updated. Here are the changes: \n\n"
    for row in original_stock_data:
        if row['name'] in name_stock_mapping:
            if delta_stock_data.get(name_stock_mapping[row['name']] + '_delta', 0) != 0:
                delta_stock_data[name_stock_mapping[row['name']] + '_delta'] *= scalar
                delta_stock_data[name_stock_mapping[row['name']] + '_delta'] = round(delta_stock_data[name_stock_mapping[row['name']] + '_delta'], 2)
                description += f"${row['name']}: {delta_stock_data[name_stock_mapping[row['name']] + '_delta']}%\n"
    embed = Embed(
        title="BopStock Market Update: " + str(datetime.now().strftime("%m/%d/%Y %H:%M:%S")), 
        color=0x00ff00, 
        description=description
    )
    discord.send_sync(embed=embed)

def send_error_message(error:str):
    embed = Embed(
        title="BopStock Error: " + str(datetime.now().strftime("%m/%d/%Y %H:%M:%S")), 
        color=0xff0000, 
        description=error
    )
    discord.send_sync(embed=embed)
