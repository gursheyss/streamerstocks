import type { Prediction, PredictionOption, Bet } from '$lib/types';
import { supabase } from '$lib/server/supabase';
import { fail } from '@sveltejs/kit';

export const load = async ({ locals: { safeGetSession } }) => {
	const session = await safeGetSession();

	// Fetch predictions
	let { data: predictionsData, error: predictionsError } = await supabase
		.from('predictions')
		.select('*')
		.order('start_time', { ascending: false });

	if (predictionsError) {
		console.error('Error fetching predictions:', predictionsError);
		return fail(500, { error: 'Error fetching predictions' });
	}

	let predictions: Prediction[] = [];
	for (let prediction of predictionsData) {
		let { data: optionsData, error: optionsError } = await supabase
			.from('prediction_options')
			.select('*, prediction_option_totals (total_amount_bet)')
			.eq('prediction_id', prediction.id);

		if (optionsError) {
			console.error(`Error fetching options for prediction ${prediction.id}:`, optionsError);
		} else {
			let options = optionsData.map((option) => ({
				...option,
				total_amount_bet: option.prediction_option_totals?.total_amount_bet || 0
			}));
			predictions.push({ ...prediction, options });
		}
	}

	let userBets: Bet[] | null = null;
	if (session.user) {
		let { data: betsData, error: betsError } = await supabase
			.from('bets')
			.select('*')
			.eq('user_id', session.user.id);

		if (betsError) {
			console.error('Error fetching user bets:', betsError);
		} else {
			userBets = betsData as Bet[];
		}
	}

	let userBalance: number | null = null;

	if (session.user) {
		const { data: profileData, error: profileError } = await supabase
			.from('profiles')
			.select('balance')
			.eq('id', session.user.id)
			.single();

		if (profileError) {
			console.error('Error fetching user profile:', profileError);
		} else {
			userBalance = profileData?.balance ?? null;
		}
	}

	return {
		predictions,
		userBets,
		userBalance
	};
};
