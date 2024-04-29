import type { Prediction, PredictionOption, Bet } from '$lib/types';
import cron from 'node-cron';
import { supabase } from '$lib/server/supabase';
import { fail } from '@sveltejs/kit';

async function updatePredictionStatus() {
	try {
		console.log('Updating prediction status...');
		const { data: predictions, error } = await supabase
			.from('predictions')
			.select('*')
			.lt('end_time', 'now()')
			.eq('status', 'ONGOING');

		if (error) {
			console.error('Error fetching predictions:', error);
			return;
		}

		// Update the status of each prediction to "Pending"
		for (const prediction of predictions) {
			const { error: updateError } = await supabase
				.from('predictions')
				.update({ status: 'PENDING' })
				.eq('id', prediction.id);

			if (updateError) {
				console.error(`Error updating status for prediction ${prediction.id}:`, updateError);
			}
			console.log(`Prediction ${prediction.id} status updated to "PENDING"`);
		}
	} catch (error) {
		console.error('Error updating prediction status:', error);
	}
}
// Create a single cron task to run the updatePredictionStatus function every minute
const task = cron.schedule('* * * * *', updatePredictionStatus);

// Start the cron task
task.start();

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
		let { data: oddsData, error: oddsError } = await supabase.rpc('get_prediction_odds', {
			p_prediction_id: prediction.id
		});

		if (oddsError) {
			console.error(`Error fetching odds for prediction ${prediction.id}:`, oddsError);
		} else {
			let totalPool = oddsData.reduce((sum, option) => sum + option.total_amount_bet, 0);
			let options = oddsData.map((optionOdds) => ({
				id: optionOdds.prediction_option_id,
				description: optionOdds.description,
				total_amount_bet: optionOdds.total_amount_bet,
				odds: optionOdds.odds,
				poolPercentage: totalPool > 0 ? (optionOdds.total_amount_bet / totalPool) * 100 : 0
			}));

			for (let option of options) {
				let { count, error } = await supabase
					.from('bets')
					.select('*', { count: 'exact', head: true })
					.eq('prediction_option_id', option.id);

				if (error) {
					console.error(`Error fetching bettor count for option ${option.id}:`, error);
				} else {
					option.bettorCount = count;
				}
			}

			predictions.push({ ...prediction, options });
		}
	}

	let userBets: Bet[] | null = null;
	if (session.user) {
		let { data: betsData, error: betsError } = await supabase
			.from('bets')
			.select('id, prediction_id, prediction_option_id, amount, placed_at')
			.eq('user_id', session.user.id);

		if (betsError) {
			console.error('Error fetching user bets:', betsError);
		} else {
			userBets = betsData as Omit<Bet, 'user_id'>[];
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
