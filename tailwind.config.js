/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			fontFamily: {
				inter: ['Inter', 'sans-serif']
			},
			colors: {
				darkgray: 'hsl(200, 6%, 10%)',
				gray: 'hsl(200, 6%, 12%)'
			}
		}
	},
	plugins: []
};
