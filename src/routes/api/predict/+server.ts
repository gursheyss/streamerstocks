import { supabase } from '$lib/server/supabase';
import { ratelimit } from '$lib/server/redis';
import { error, json } from '@sveltejs/kit';

// /api/predict POST
export async function POST({ request, locals: { safeGetSession } }) {
	const session = await safeGetSession();
	if (!session.user) {
		throw error(401, 'Unauthorized');
	}

	const { success, reset } = await ratelimit.limit(session.user.id);
	if (!success) {
		const timeRemaining = Math.floor((reset - Date.now()) / 1000);
		throw error(429, `Rate limit exceeded. Try again in ${timeRemaining} seconds.`);
	}

	const uuid = session.user.id;
	const { predictionId, optionId, betAmount } = await request.json();

	// Validate the bet amount is a number and greater than zero
	if (typeof betAmount !== 'number' || betAmount <= 0) {
		throw error(400, 'Invalid bet amount');
	}
	// Check if the user has already placed a bet on this prediction
	const { data: existingBet, error: existingBetError } = await supabase
		.from('bets')
		.select('*')
		.eq('user_id', uuid)
		.eq('prediction_id', predictionId)
		.maybeSingle();

	if (existingBetError) {
		console.error('Error checking for existing bet:', existingBetError);
		throw error(500, 'Error checking for existing bet');
	}

	// If a bet already exists, throw an error
	if (existingBet) {
		throw error(400, 'You have already placed a bet on this prediction.');
	}

	// Fetch the user's balance
	const { data: profileData, error: profileError } = await supabase
		.from('profiles')
		.select('balance')
		.eq('id', uuid)
		.single();

	if (profileError || !profileData) {
		console.error('Error fetching user profile:', profileError);
		throw error(500, 'Error fetching user profile');
	}

	const userBalance = profileData.balance;

	// Check if the user has enough balance to place the bet
	if (userBalance < betAmount) {
		throw error(400, 'Insufficient balance to place bet');
	}

	// Check if the prediction is still active and if the option exists
	const { data: predictionData, error: predictionError } = await supabase
		.from('predictions')
		.select('id, is_active')
		.eq('id', predictionId)
		.single();

	if (predictionError || !predictionData || !predictionData.is_active) {
		console.error('Prediction not found or no longer active:', predictionError);
		throw error(404, 'Prediction not found or no longer active');
	}

	// Proceed to place the bet
	const { error: betError } = await supabase.from('bets').insert([
		{
			prediction_id: predictionId,
			user_id: uuid,
			prediction_option_id: optionId,
			amount: betAmount
		}
	]);

	if (betError) {
		console.error('Error placing bet:', betError);
		throw error(500, 'Error placing bet');
	}

	// Update the total amount bet for the prediction option
	const { error: incrementBetError } = await supabase.rpc('increment_total_bet', {
		p_prediction_id: predictionId,
		p_option_id: optionId,
		p_bet_amount: betAmount
	});

	if (incrementBetError) {
		console.error('Error incrementing total bet:', incrementBetError);
		throw error(500, 'Error incrementing total bet');
	}

	return new Response(JSON.stringify({ success: true, message: 'Bet placed successfully' }), {
		headers: {
			'Content-Type': 'application/json'
		}
	});
}
