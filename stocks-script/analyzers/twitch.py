from os import getenv

import select
import socket
import time

from analyzers.analyze import get_sentiment

sock = socket.socket()

# Connect to Twitch chat
sock.connect(('irc.chat.twitch.tv', 6667))
sock.send(f"PASS oauth:{getenv('TWITCH_TOKEN')}\n".encode('utf-8'))
sock.send("NICK bopstocks\n".encode('utf-8'))
sock.send("JOIN #jasontheween\n".encode('utf-8'))
print("Connected to Twitch chat")

# Ignore the welcome messages
sock.recv(2048).decode('utf-8')

def analyze_chat_batch(analysis_time:int, keywords:list, analysis_group:list) -> dict:
    '''Analyze chat messages over a period of time for sentiment towards a group of people in JSON format'''
    batch = ""
    batch_size = 0
    start_time = time.time()
    
    while ((time.time() - start_time) < analysis_time):
        ready = select.select([sock], [], [], 1.0)  # Wait for 1 second
        if ready[0]:    # If there is data to read
            resp = sock.recv(2048).decode('utf-8')
            if ' #jasontheween :' in resp:
                resp = resp[resp.index(' #jasontheween :') + 16:].strip()
                if batch_size < 50 and 4 < len(resp) < 30 and any(keyword in resp.lower() for keyword in keywords):
                    resp.replace("you", "jason")
                    batch += f'- {resp}\n'
                    batch_size += 1
                    print(f"Message added to batch: {resp}")

    sentiment = {}
    for person in analysis_group:
        sentiment[person.lower().replace(" ", "") + "_sentiment"] = 0
        
    for i in range(0, len(analysis_group), 10):
        prompt = "Given chat messages, analyze the overall sentiment (negative=-1, neutral=0, positive=1) towards a group of people in JSON format.\nMessages:\n" + batch + "\n" + f"People: {', '.join([person for person in analysis_group[i:i+10][:-1]])}, and {analysis_group[i:i+10][-1]}."
        sentiment.update(get_sentiment(prompt, analysis_group=analysis_group[i:i+10]))

    return sentiment
