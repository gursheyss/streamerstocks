import { TWITCH_EVENTSUB_SECRET, TWITCH_CLIENT_ID, TWITCH_AUTH_TOKEN } from '$env/static/private';
import { supabase } from '$lib/server/supabase';
import crypto from 'crypto';

// Notification request headers
const TWITCH_MESSAGE_ID = 'Twitch-Eventsub-Message-Id'.toLowerCase();
const TWITCH_MESSAGE_TIMESTAMP = 'Twitch-Eventsub-Message-Timestamp'.toLowerCase();
const TWITCH_MESSAGE_SIGNATURE = 'Twitch-Eventsub-Message-Signature'.toLowerCase();
const MESSAGE_TYPE = 'Twitch-Eventsub-Message-Type'.toLowerCase();

// Prepend this string to the HMAC that's created from the message
const HMAC_PREFIX = 'sha256=';


/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
    // Add the amount of channel points to the user's balance
    const addChannelPointsToBalance = async (amt_weeniebucks:number, user_id:string, id:number, broadcaster_id:number, reward_id:number) => {
        const { data: userData, error: userError } = await supabase.from('profiles').select('balance, amount_redeemed',).eq('user_id', user_id);
        let status = "CANCELED";
        if (userError || userData === undefined) {
            console.error("User not found");
        }
        else {
            userData[0]['balance'] += amt_weeniebucks;
            userData[0]['amount_redeemed'] += amt_weeniebucks;
            const { data: updateData, error: updateError } = await supabase.from('profiles').update(userData[0]).eq('user_id', user_id).select();
            if (updateError) {
                console.error("Failed to update balance");
            }
            else {
                status = "FULFILLED";
            }
        }

        const response = await fetch(`https://api.twitch.tv/helix/channel_points/custom_rewards/redemptions?broadcaster_id=${broadcaster_id}&reward_id=${reward_id}&id=${id}`, {
            method: 'PATCH',
            headers: {
                'Client-Id': TWITCH_CLIENT_ID,
                'Authorization': 'Bearer ' + TWITCH_AUTH_TOKEN,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "status": status
            })
        });
        if (!response.ok) {
            console.error('Failed to update reward status');
        }
    }

    const secret = getSecret();
    const message = await getHmacMessage(request);
    const hmac = HMAC_PREFIX + getHmac(secret, message);

    // Verify the message
    if (await verifyMessage(hmac, request.headers.get(TWITCH_MESSAGE_SIGNATURE) as string)) {
        const notification = await request.json();
        // Handle the notification
        if (request.headers.get(MESSAGE_TYPE) === 'notification') {
            if (
                notification.subscription.type === 'channel.channel_points_custom_reward_redemption.add'
                && notification.event.reward.title.toLowerCase().includes('bucks') // SHOULD CHANCE THIS TO check for reward id but thats later and i need to study
            ) {
                addChannelPointsToBalance(
                    notification.event.reward.cost/10, 
                    notification.event.user_id,
                    notification.event.id,
                    notification.event.broadcaster_user_id,
                    notification.event.reward.id
                );
            }
            return new Response(null, {status: 204});
        }
        // Handle the challenge
        else if (request.headers.get(MESSAGE_TYPE) === 'webhook_callback_verification') {
            return new Response(notification.challenge, {
                status: 200,
                headers: {
                    'Content-Type': 'text/plain'
                }
            });
        }
        // Handle the revocation
        else if (request.headers.get(MESSAGE_TYPE) === 'revocation') {
            console.log(`${notification.subscription.type} has been revoked`);
            console.log(`Reason: ${notification.subscription.status}`);
            console.log(`condition: ${JSON.stringify(notification.subscription.condition)}`);
            return new Response(null, {status: 204});
        }
        // Handle unknown message types
        else {
            console.log(`Unknown message type: ${request.headers.get(MESSAGE_TYPE)}`);
            return new Response(null, {status: 204});
        }
    }
    // If the message is not verified, return a 403
    else {
        console.log("403");
        return new Response(null, {status: 403});
    }
}

function getSecret() : string {
    return TWITCH_EVENTSUB_SECRET as string;
}

// Build the message used to get the HMAC.
async function getHmacMessage(request: Request): Promise<string> {
    const newRequest = request.clone();
    return (newRequest.headers.get(TWITCH_MESSAGE_ID)! + 
        newRequest.headers.get(TWITCH_MESSAGE_TIMESTAMP)! + 
        (await newRequest.text()));
}

// Get the HMAC.
function getHmac(secret:string, message:string): string {
    return crypto.createHmac('sha256', secret)
    .update(message)
    .digest('hex');
}

// Verify whether our hash matches the hash that Twitch passed in the header.
async function verifyMessage(hmac: string, verifySignature: string | null): Promise<boolean> {
    if (verifySignature === null) {
        return false;
    }
    return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(verifySignature));
}
