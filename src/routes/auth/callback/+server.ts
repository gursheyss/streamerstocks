import { redirect } from '@sveltejs/kit';

export const GET = async (event) => {
	const {
		url,
		locals: { supabase }
	} = event;
	const code = url.searchParams.get('code') as string;
	const next = url.searchParams.get('next') ?? '/';

	if (code) {
		const { error } = await supabase.auth.exchangeCodeForSession(code);
		if (!error) {
			redirect(303, `/${encodeURIComponent(next.slice(1))}?signedIn=True`);
		}
	}

	// return the user to an error page with instructions
	redirect(303, '/auth/auth-code-error');
};
