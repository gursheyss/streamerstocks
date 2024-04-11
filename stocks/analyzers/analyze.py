import json
from os import getenv
from dotenv import load_dotenv

import openai

load_dotenv()

client = openai.OpenAI(
    base_url="https://api.fireworks.ai/inference/v1",
    api_key = getenv("FIREWORKS_API_KEY")
)

def get_sentiment(prompt:str, analysis_group:list) -> dict:
    '''Analyzes the sentiment of the comment based on the prompt'''
    properties = {}
    for person in analysis_group:
        properties[person.lower().replace(" ", "") + "_sentiment"] = {"type": "integer", "enum": [-1,0,1]}

    completion = client.chat.completions.create(
        model="accounts/fireworks/models/mixtral-8x7b-instruct",
        max_tokens=1250,
        response_format={
            "type": "json_object", 
            "schema": {
                "type": "object",
                "properties": properties,
                "required": list(properties.keys())
            },
        },
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ]
    )   
    return json.loads(completion.choices[0].message.content)