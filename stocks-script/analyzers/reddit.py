from datetime import datetime
from os import getenv
import logging

import praw

from analyzers.analyze import get_sentiment

logging.disable(logging.CRITICAL)

reddit = praw.Reddit(
    client_id=getenv("REDDIT_CLIENT_ID"),
    client_secret=getenv("REDDIT_CLIENT_SECRET"),
    user_agent="your bot 0.1"
)


post_body_sentiment_cache = {}
comment_sentiment_cache = {}

def get_posts_sentiment(
        subreddit_name:str, 
        analysis_group:list,
        start_datetime_unix:float=datetime.combine(datetime.now().date(), datetime.min.time()).timestamp(), 
        end_datetime_unix:float=datetime.combine(datetime.now().date(), datetime.max.time()).timestamp(),
        criteria:list=['body', 'comments'],
        verbose:bool=True
    ) -> dict:
    '''Analyzes the sentiment of the posts in the subreddit for a given timeframe (current day by default) for each person in the analysis group'''
    posts = _get_posts(subreddit_name, start_datetime_unix, end_datetime_unix)
    sentiment = {}
    post_count = 0
    for post in posts:
        post_count += 1
        if 'body' in criteria:
            post_sentiment = _analyze_post_by_body(post, analysis_group)
            for key in set(post_sentiment.keys()):
                sentiment[key] = sentiment.get(key, 0) + post_sentiment[key]
        if 'comments' in criteria:
            comments_sentiment = _analyze_post_by_comments(post, analysis_group)
            for key in set(comments_sentiment.keys()):
                sentiment[key] = sentiment.get(key, 0) + comments_sentiment[key]
        if verbose:
            print(f"Post {post_count}/{len(posts)}: {post.title} analyzed.")
    return sentiment

def _analyze_post_by_body(post:praw.reddit.Submission, analysis_group:list, text_post_only:bool=False) -> dict:
    '''Analyzes the sentiment of the post by analyzing the sentiment of the post body for each person in the analysis group'''
    sentiment = {}
    # Initialize the sentiment for each person in the analysis group
    for person in analysis_group:
        sentiment[person.lower().replace(" ", "") + "_sentiment"] = 0
    # If the post has been analyzed before, get the sentiment from cache
    if post.id in post_body_sentiment_cache:
        sentiment = dict(post_body_sentiment_cache[post.id])
    else:
        # If the post is a text post or text_post_only is False, analyze the sentiment of the post body
        if not text_post_only or post.is_self:
            sentiment = _get_post_body_sentiment(post, analysis_group)
        # Cache the sentiment of the post
        post_body_sentiment_cache[post.id] = dict(sentiment)
        # Scale the sentiment by the number of upvotes

    for key in set(sentiment.keys()):
        sentiment[key] *= post.score
    return sentiment


def _analyze_post_by_comments(post:praw.reddit.Submission, analysis_group:list) -> dict:
    '''Analyzes the sentiment of the post by analyzing the sentiment of the comments for each person in the analysis group'''
    sentiment = {}
    # Initialize the sentiment for each person in the analysis group
    for person in analysis_group:
        sentiment[person.lower().replace(" ", "") + "_sentiment"] = 0
    # Get the comments of the post    
    comments = _get_comments(post)
    if comments:
        for comment in comments:
            # If the comment has been analyzed before, get the sentiment from cache
            comment_sentiment = {}
            if comment.id in comment_sentiment_cache:
                comment_sentiment = comment_sentiment_cache[comment.id]
            else:
                comment_sentiment = _get_comment_sentiment(post, comment, analysis_group)
                # Cache the sentiment of the comment
                comment_sentiment_cache[comment.id] = dict(comment_sentiment)
            # Scale the sentiment by the number of upvotes
            for key in set(comment_sentiment.keys()):
                comment_sentiment[key] *= comment.score
            # Add the sentiment of the comment to the sentiment of the post
            for key in set(comment_sentiment.keys()):
                sentiment[key] = sentiment.get(key, 0) + comment_sentiment[key]
    return sentiment

def _get_post_body_sentiment(post:praw.reddit.Submission, analysis_group:list) -> dict:
    '''Analyzes the sentiment of the post by analyzing the sentiment of the post body for each person in the analysis group'''
    title = post.title
    lower_title = title.lower()
    post_body = post.selftext
    lower_post_body = post_body.lower()
    sentiment = {}
    for person in analysis_group:
        sentiment[person.lower().replace(" ", "") + "_sentiment"] = 0

    filtered_analysis_group = [person for person in analysis_group if person.lower() in lower_title or person.lower() in lower_post_body]

    if filtered_analysis_group:
        if len(filtered_analysis_group) == 1:
            prompt = "Given a post and its title, analyze the post's sentiment (negative=-1, neutral=0, positive=1) towards a person in JSON format." + "\nPost title: " + title + "\nPost: " + post_body + "\nPerson: " + filtered_analysis_group[0] + "."
            sentiment.update(get_sentiment(prompt, analysis_group=filtered_analysis_group))
        else:
            prompt = "Given a post and its title, analyze the post's sentiment (negative=-1, neutral=0, positive=1) towards a group of people in JSON format." + "\nPost title: " + title + "\nPost: " + post_body + "\n" + f"People: {', '.join([person for person in analysis_group[:-1]])}, and {analysis_group[-1]}."
            sentiment.update(get_sentiment(prompt, analysis_group=filtered_analysis_group))

    return sentiment

def _get_comment_sentiment(post:praw.reddit.Submission, comment:praw.reddit.Comment, analysis_group:list) -> dict:
    '''Analyzes the sentiment of the comment for each person in the analysis group'''
    title = post.title
    comment_body = comment.body.replace("\n\n", "\n").replace("\n", ". ")
    lower_title = title.lower()
    lower_comment_body = comment_body.lower()
    sentiment = {}
    for person in analysis_group:
        sentiment[person.lower().replace(" ", "") + "_sentiment"] = 0

    filtered_analysis_group = [person for person in analysis_group if person.lower() in lower_title or person.lower() in lower_comment_body]
    
    if filtered_analysis_group:
        if len(filtered_analysis_group) == 1:
            prompt = "Given a comment on a post and the title of the post, analyze the comment's sentiment (negative=-1, neutral=0, positive=1) towards a person in JSON format." + "\nPost title: " + title + "\nComment: " + comment_body + "\nPerson: " + filtered_analysis_group[0] + "." 
            sentiment.update(get_sentiment(prompt, analysis_group=filtered_analysis_group))
        else:
            prompt = "Given a comment on a post and the title of the post, analyze the comment's sentiment (negative=-1, neutral=0, positive=1) towards a group of people in JSON format." + "\nPost title: " + title + "\nComment: " + comment_body + "\n" + f"People: {', '.join([person for person in filtered_analysis_group[:-1]])}, and {filtered_analysis_group[-1]}."
            sentiment.update(get_sentiment(prompt, analysis_group=filtered_analysis_group))

    return sentiment

def _get_posts(subreddit_name:str, start_datetime_unix:float, end_datetime_unix:float) -> list:
    '''Gets the posts (out of the last 1000) for the a given timeframe in the subreddit'''
    subreddit = reddit.subreddit(subreddit_name)
    posts = [post for post in subreddit.new(limit=1000) if start_datetime_unix <= post.created_utc <= end_datetime_unix]
    return posts

def _get_comments(post) -> list:
    '''Gets all the comments from the post'''
    post.comments.replace_more(limit=None)
    all_comments = post.comments.list()
    return all_comments
