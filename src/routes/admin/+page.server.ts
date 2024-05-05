import { error, redirect } from '@sveltejs/kit';

export const load = async ({ locals: { safeGetSession, supabase } }) => {
	const session = await safeGetSession();
	if (!session.user) {
		redirect(302, '/');
	}
	const { data: profileData, error: profileError } = await supabase
		.from('profiles')
		.select('label')
		.eq('id', session.user.id);

	if (profileError) {
		error(500, profileError.message);
	}

	const label = profileData[0].label;

	if (label !== 'dev') {
		redirect(302, '/');
	}
};

export const actions = {
	create: async ({ request, locals: { supabase, safeGetSession } }) => {
		const session = await safeGetSession();
		if (!session.user) {
			redirect(302, '/');
		}
		const { data: profileData, error: profileError } = await supabase
			.from('profiles')
			.select('label')
			.eq('id', session.user.id);

		if (profileError) {
			error(500, profileError.message);
		}

		const label = profileData[0].label;

		if (label !== 'dev') {
			redirect(302, '/');
		}

		const formData = await request.formData();
		const title = formData.get('title');
		const formOptions = formData.getAll('options');
		let options: string[] = [];
		if (typeof formOptions[0] === 'string') {
			options = formOptions[0].split(',').map((option) => option.trim());
		}
		const endTime = String(formData.get('end_time'));
		const timeZone = String(formData.get('time_zone'));

		// Convert endTime to Date object
		const endTimeDate = new Date(endTime);

		// Convert Date object to UTC string
		const endTimeInUTC = endTimeDate.toISOString();

		const { data: predictionsTableData, error: predictionsTableError } = await supabase
			.from('predictions')
			.insert({
				description: title,
				end_time: endTimeInUTC
			})
			.select('id')
			.single();

		if (predictionsTableError) {
			error(500, predictionsTableError.message);
		}

		const { data: predictionsOptionsTableData, error: predictionsOptionsTableError } =
			await supabase
				.from('prediction_options')
				.insert(
					options.map((option) => ({ prediction_id: predictionsTableData.id, description: option }))
				);

		if (predictionsOptionsTableError) {
			console.log(predictionsOptionsTableError);
			error(500, predictionsOptionsTableError);
		}
	},
	chooseOutcome: async ({ request, locals: { supabase, safeGetSession } }) => {
		const session = await safeGetSession();
		if (!session.user) {
			redirect(302, '/');
		}
		const { data: profileData, error: profileError } = await supabase
			.from('profiles')
			.select('label')
			.eq('id', session.user.id);

		if (profileError) {
			error(500, profileError.message);
		}

		const label = profileData[0].label;
		if (label !== 'dev') {
			redirect(302, '/');
		}

		const formData = await request.formData();
		const predictionId = formData.get('prediction_id');
		const optionId = formData.get('option_id');

		console.log('predictionId:', predictionId);
		console.log('optionId:', optionId);

		const { error: updatePredictionError } = await supabase.rpc('distribute_winnings', {
			p_prediction_id: predictionId,
			p_winning_option_id: optionId
		});

		if (updatePredictionError) {
			error(500, updatePredictionError.message);
		}
	}
};
