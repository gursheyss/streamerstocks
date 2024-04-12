import type { Comment, MarketItem } from '$lib/types';

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

		await supabase.from('comments').insert([
			{
				comment: comment,
				stock_id: stockId,
				user_id: userId
			}
		]);
	}
};

export const load = async ({ params, locals: { supabase } }) => {
	let comments: Comment[] = [];
	const { ticker } = params;
	const { data: initialData } = await supabase.from('market').select('*').ilike('ticker', ticker);

	const marketData = initialData as MarketItem[];

	const { data: commentsData, error: commentsError } = await supabase
		.from('comments')
		.select(
			`
					id,
					comment,
					user_id,
					created_at,
					profiles!comments_user_id_fkey (
							avatar_url,
							username
					)
				`
		)
		.eq('stock_id', marketData[0].id)
		.order('id', { ascending: false });

	if (commentsError) {
		console.error('Error fetching comments:', commentsError);
	} else {
		const newComments = commentsData.map((comment) => ({
			id: comment.id,
			avatar_url: comment.profiles?.avatar_url || null,
			username: comment.profiles?.username || null,
			comment: comment.comment,
			created_at: comment.created_at
		}));

		// Update existing comments
		comments = comments.map((c) => newComments.find((nc) => nc.id === c.id) || c);

		// Add new comments
		const newCommentsToAdd = newComments.filter((nc) => !comments.find((c) => c.id === nc.id));
		comments = [...comments, ...newCommentsToAdd];
	}

	return {
		marketData,
		comments
	};
};
