from os import getenv

import select
import socket
import threading
import time

from analyzers.analyze import get_sentiment


class StopThread(threading.Thread):
    def __init__(self,  *args, **kwargs):
        super(StopThread, self).__init__(*args, **kwargs)
        self._stop_event = threading.Event()

    def stop(self):
        self._stop_event.set()

    def stopped(self):
        return self._stop_event.is_set()
    

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
    batch = ""
    sentiment = {}
    for person in analysis_group:
        sentiment[person.lower().replace(" ", "") + "_sentiment"] = 0
    
    filtered_analysis_group = []
        
    try:
        '''Analyze chat messages over a period of time for sentiment towards a group of people in JSON format'''
        batch_size = 0

        def stop_loop():
            time.sleep(360)  # If stuck analyzing for 6 minutes, stop
            raise Exception("timeout")

        stop_thread = StopThread(target=stop_loop)
        stop_thread.start()
        

        while batch_size < max_batch_size:
            ready = select.select([sock], [], [], 1.0)  # Wait for 1 second
            if ready[0]:    # If there is data to read
                resp = sock.recv(1024).decode('utf-8', 'ignore')
                if ' #jasontheween :' in resp:
                    resp = resp[resp.rindex(' #jasontheween :') + 16:].strip().lower()
                    len_resp = len(resp)
                    if (4 < len_resp < 30):
                        for keyword in keywords:
                            if keyword in resp.split(' '):
                                filtered_analysis_group.append(keyword)
                                break
                        batch += f'- {resp}\n'
                        batch_size += 1
                        print(f"Message added to batch: {resp}")

        if filtered_analysis_group:
            if len(filtered_analysis_group) == 1:
                prompt = "Given a list of messages, analyze the overall sentiment (negative=-1, neutral=0, positive=1) towards a person in JSON format.\nMessages:\n" + batch + "\n" + f"Person: {filtered_analysis_group[0]}."
                sentiment.update(get_sentiment(prompt, analysis_group=filtered_analysis_group))
            else:
                prompt = "Given a list of messages, analyze the overall sentiment (negative=-1, neutral=0, positive=1) towards a group of people in JSON format.\nMessages:\n" + batch + "\n" + f"People: {', '.join([person for person in filtered_analysis_group[:-1]])}, and {filtered_analysis_group[-1]}."
                sentiment.update(get_sentiment(prompt, analysis_group=filtered_analysis_group))
    except Exception as e:
        if e == "timeout":
            print("Timeout")
        print(e)
    finally:
        stop_thread.stop()
        stop_thread.join()
        if filtered_analysis_group:
            if len(filtered_analysis_group) == 1:
                prompt = "Given a list of messages, analyze the overall sentiment (negative=-1, neutral=0, positive=1) towards a person in JSON format.\nMessages:\n" + batch + "\n" + f"Person: {filtered_analysis_group[0]}."
                sentiment.update(get_sentiment(prompt, analysis_group=filtered_analysis_group))
            else:
                prompt = "Given a list of messages, analyze the overall sentiment (negative=-1, neutral=0, positive=1) towards a group of people in JSON format.\nMessages:\n" + batch + "\n" + f"People: {', '.join([person for person in filtered_analysis_group[:-1]])}, and {filtered_analysis_group[-1]}."
                sentiment.update(get_sentiment(prompt, analysis_group=filtered_analysis_group))
        return sentiment
