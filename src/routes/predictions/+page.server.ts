import type { Prediction, PredictionOption, Bet } from '$lib/types';
import cron from 'node-cron';
import { supabase } from '$lib/server/supabase';
import { fail } from '@sveltejs/kit';
import { redis } from '$lib/server/redis';

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

			await redis.hmset(`prediction:${prediction.id}`, {
				status: 'PENDING'
			});
		}
	} catch (error) {
		console.error('Error updating prediction status:', error);
	}
}
// Create a single cron task to run the updatePredictionStatus function every minute
const task = cron.schedule('* * * * *', updatePredictionStatus);

// Start the cron task
task.start();

async function initializePredictions() {
	try {
		console.log('Initializing predictions cache...');
		const { data: predictionsData, error: predictionsError } = await supabase
			.from('predictions')
			.select('*')
			.order('start_time', { ascending: false });

		if (predictionsError) {
			console.error('Error fetching predictions:', predictionsError);
			return;
		}

		const pipeline = redis.pipeline();

		for (const prediction of predictionsData) {
			const { data: oddsData, error: oddsError } = await supabase.rpc('get_prediction_odds', {
				p_prediction_id: prediction.id
			});

			if (oddsError) {
				console.error(`Error fetching odds for prediction ${prediction.id}:`, oddsError);
				continue;
			}

			const totalPool = oddsData.reduce((sum, option) => sum + option.total_amount_bet, 0);
			const options = await Promise.all(
				oddsData.map(async (optionOdds) => {
					const { count, error } = await supabase
						.from('bets')
						.select('*', { count: 'exact', head: true })
						.eq('prediction_option_id', optionOdds.prediction_option_id);

					if (error) {
						console.error(
							`Error fetching bettor count for option ${optionOdds.prediction_option_id}:`,
							error
						);
					}

					return {
						id: optionOdds.prediction_option_id,
						description: optionOdds.description,
						total_amount_bet: optionOdds.total_amount_bet,
						odds: optionOdds.odds,
						poolPercentage: totalPool > 0 ? (optionOdds.total_amount_bet / totalPool) * 100 : 0,
						bettorCount: count || 0
					};
				})
			);
			pipeline.hmset(`prediction:${prediction.id}`, {
				id: prediction.id,
				description: prediction.description,
				start_time: prediction.start_time,
				end_time: prediction.end_time,
				status: prediction.status,
				winning_option_id: prediction.winning_option_id || '',
				options: options
			});

			pipeline.sadd('prediction_ids', prediction.id);
		}

		await pipeline.exec();
		await redis.expire('prediction_ids', 60);

		console.log('Predictions cache initialized successfully!');
	} catch (error) {
		console.error('Error initializing predictions cache:', error);
	}
}

// Create a cron task to run the initializePredictions function every minute
const initPredictionTask = cron.schedule('* * * * *', initializePredictions);
initPredictionTask.start();

async function initializeUserBets(userId: string) {
	try {
		console.log(`Initializing user bets cache for user...`);
		const { data: betsData, error: betsError } = await supabase
			.from('bets')
			.select('id, prediction_id, prediction_option_id, amount, placed_at')
			.eq('user_id', userId);
		if (betsError) {
			console.error('Error fetching user bets:', betsError);
			return;
		}

		const pipeline = redis.pipeline();

		for (const bet of betsData) {
			pipeline.hmset(`user:${userId}:bet:${bet.id}`, {
				id: bet.id,
				prediction_id: bet.prediction_id,
				prediction_option_id: bet.prediction_option_id,
				amount: bet.amount,
				placed_at: bet.placed_at
			});
			pipeline.sadd(`user:${userId}:bets`, bet.id);
		}

		await pipeline.exec();
		await redis.expire(`user:${userId}:bets`, 86400);

		console.log(`User bets cache initialized successfully for user!`);
	} catch (error) {
		console.error(`Error initializing user bets cache for user:`, error);
	}
}
export const load = async ({ locals: { safeGetSession } }) => {
	const session = await safeGetSession();

	try {
		const predictionIdsExist = await redis.exists('prediction_ids');

		if (!predictionIdsExist) {
			await initializePredictions();
		}

		const predictionIds = await redis.smembers('prediction_ids');

		const predictions: Prediction[] = await Promise.all(
			predictionIds.map(async (predictionId) => {
				const predictionData = await redis.hgetall(`prediction:${predictionId}`);
				return {
					id: parseInt(predictionData.id),
					description: predictionData.description,
					start_time: predictionData.start_time,
					end_time: predictionData.end_time,
					status: predictionData.status,
					winning_option_id: predictionData.winning_option_id
						? parseInt(predictionData.winning_option_id)
						: null,
					options: predictionData.options
				};
			})
		);

		let userBets: Bet[] | null = null;
		if (session.user) {
			const userBetsExist = await redis.exists(`user:${session.user.id}:bets`);

			if (!userBetsExist) {
				await initializeUserBets(session.user.id);
			}

			const userBetIds = await redis.smembers(`user:${session.user.id}:bets`);

			userBets = await Promise.all(
				userBetIds.map(async (betId) => {
					const betData = await redis.hgetall(`user:${session.user.id}:bet:${betId}`);
					return {
						id: parseInt(betData.id),
						prediction_id: parseInt(betData.prediction_id),
						prediction_option_id: parseInt(betData.prediction_option_id),
						amount: parseFloat(betData.amount),
						placed_at: betData.placed_at
					};
				})
			);
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
	} catch (error) {
		console.error('Error fetching predictions:', error);
		return fail(500, { error: 'Error fetching predictions' });
	}
};
