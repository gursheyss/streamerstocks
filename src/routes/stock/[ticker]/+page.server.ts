export const actions = {
	submitComment: async ({ locals: { supabase, getSession }, request }) => {
		// get form data
		const session = await getSession();
		if (!session) {
			return { status: 401, body: { message: 'Unauthorized' } };
		}
		const data = await request.formData();
		const comment = data.get('comment');
		const stockId = data.get('currentId');

		console.log(comment, stockId);
		const userId = session?.user.id;

		const { data: newComment, error } = await supabase.from('comments').insert([
			{
				comment: comment,
				stock_id: stockId,
				user_id: userId
			}
		]);
	}
};
