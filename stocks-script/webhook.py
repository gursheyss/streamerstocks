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

name_id_mapping = {
    35: "vsbtobi",
    14: "effy",
    37: "ba",
    6: "emily",
    24: "sunny",
    9: "ybg",
    5: "baybeerae",
    2: "mira",
    30: "kc",
    17: "joymei",
    7: "jess",
    34: "vsbdat",
    40: "arky",
    21: "kailey",
    36: "yugi",
    42: "nosiiree",
    39: "malik",
    23: "sa",
    20: "alex",
    26: "ellen",
    10: "santi",
    22: "a2guapo",
    28: "jason",
    11: "selena",
    25: "aliyah",
    13: "giaan",
    27: "kaichu",
    8: "raph",
    16: "prod",
    33: "vsblandon",
    12: "keli",
    29: "jdab",
    4: "jes",
    15: "mariah",
    3: "alyssa",
    18: "ron",
    19: "irene"
}

discord = Webhook(url=getenv("DISCORD_WEBHOOK_URL"))

def send_market_update(old_prices:list, new_prices:dict):
    description = "The market has been updated. Here are the changes: \n\n"
    for i in range(len(old_prices)):
        if abs(old_prices[i]['price'] - new_prices[i]['price']) > 0.1:
            description += f"{name_id_mapping[old_prices[i]['stock_id']]}: {old_prices[i]['price']} -> {new_prices[i]['price']}\n"

    if description != "The market has been updated. Here are the changes: \n\n":
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
