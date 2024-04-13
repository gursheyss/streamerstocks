import { PUBLIC_TWITCH_EVENTSUB_SECRET } from '$env/static/public';
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
    const addChannelPointsToBalance = async (amt_weeniebucks:number, user_id:string) => {
        const { data: userData, error: userError } = await supabase.from('profiles').select('balance, amount_redeemed',).eq('user_id', user_id);
        if (userError || userData === undefined) {
            console.error("User not found");
        }
        else {
            userData[0]['balance'] += amt_weeniebucks;
            userData[0]['amount_redeemed'] += amt_weeniebucks;
            const { data: updateData, error: updateError } = await supabase.from('profiles').update(userData[0]).eq('user_id', user_id).select();
            if (updateError) {
                console.error("Failed to update balance");
            };
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
                // && notification.event.reward.id === 'ASK DANISH FOR THE ID FOR THE REWARD WE LISTENING FOR'
            ) {
                addChannelPointsToBalance(notification.event.reward.cost/10, notification.event.user_id);
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
    return PUBLIC_TWITCH_EVENTSUB_SECRET as string;
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
