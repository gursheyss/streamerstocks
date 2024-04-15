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
				gray2: 'hsl(200, 6%, 12%)',
				lightgray: 'hsl(200, 6%, 17%)'
			}
		}
	},
	plugins: [require('daisyui')],
	daisyui: {
		themes: [
			{
				dark: {
					...require('daisyui/src/theming/themes')['dark'],
					'base-100': 'hsl(200, 6%, 17%)'
				}
			}
		]
	}
};
