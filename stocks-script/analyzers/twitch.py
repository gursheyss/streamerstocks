from os import getenv

import select
import socket

from analyzers.analyze import get_sentiment

sock = socket.socket()
# Connect to Twitch chat
sock.connect(('irc.chat.twitch.tv', 6667))
sock.send(f"PASS oauth:{getenv('TWITCH_TOKEN')}\n".encode('utf-8'))
sock.send("NICK bopstocks\n".encode('utf-8'))
sock.send("JOIN #jasontheween\n".encode('utf-8'))
print("Connected to Twitch chat")
# Ignore the welcome messages
sock.recv(1024).decode('utf-8')

def analyze_chat_batch(max_batch_size:int, keywords:list, analysis_group:list) -> dict:
    sentiment = {}
    for person in analysis_group:
        sentiment[person.lower().replace(" ", "") + "_sentiment"] = 0
        
    try:
        '''Analyze chat messages over a period of time for sentiment towards a group of people in JSON format'''
        batch = ""
        batch_size = 0
        
        while batch_size < max_batch_size:
            ready = select.select([sock], [], [], 1.0)  # Wait for 1 second
            if ready[0]:    # If there is data to read
                resp = sock.recv(1024).decode('utf-8', 'ignore')
                if ' #jasontheween :' in resp:
                    resp = resp[resp.index(' #jasontheween :') + 16:].strip().lower()
                    if (4 < len(resp) < 30) and any(keyword in resp.split(' ') for keyword in keywords):
                        batch += f'- {resp}\n'
                        batch_size += 1
                        print(f"Message added to batch: {resp}")

        for i in range(0, len(analysis_group), 10):
            prompt = "Given a list of messages, analyze the overall sentiment (negative=-1, neutral=0, positive=1) towards a group of people in JSON format.\nMessages:\n" + batch + "\n" + f"People: {', '.join([person for person in analysis_group[i:i+10][:-1]])}, and {analysis_group[i:i+10][-1]}."
            sentiment.update(get_sentiment(prompt, analysis_group=analysis_group[i:i+10]))
    except Exception as e:
        print(e)
    finally:
        return sentiment
