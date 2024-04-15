export const GET = async (event) => {
	const {
		url
	} = event;
	console.log(url.searchParams);
    return new Response('o________O', {status: 200});
};
