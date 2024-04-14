<script>
	import AboutCard from '$lib/components/AboutCard.svelte';
</script>

<div class="px-4 py-8">
	<h1 class="text-4xl font-bold text-center mb-8">About BopStocks</h1>
	<AboutCard
		title={'What is "BopStocks"?'}
		description={"BopStocks is a stock trading simulation based on streamer JasonTheWeen's community. \
            The stocks featured on this website are based on people on Jason's stream \
            and are intended for entertainment purposes only. Please note that the values assigned to these \
            people do not reflect their actual worth or qualities. We encourage users to engage \
            respectfully and responsibly with the simulated stock market, keeping in mind that the people \
            represented are real individuals with their own lives and reputations. Any perceived gains or losses in this simulated environment \
            should not be taken personally. Remember, the primary goal here is to have fun and enjoy the experience!"}
		side="right"
		img_url="https://yt3.googleusercontent.com/jD6glKLJcBjMEPkSn6v0goMKp5U6TtcYH3Q9SlL72jp2jG0QlpAZRAkq3yWpkT1AKU3MlqEaDP8=s900-c-k-c0x00ffffff-no-rj"
	/>
	<AboutCard
		title={'How it works'}
		description={"BopStocks simulates the stock market using a complex algorithm based on two main factors:\n\n \
            1. The supply and demand of their stock\n \
            2. The community's perception of them \n\n \
            So if someone is blackballed, their stock price may drop drastically. Conversely, if a person \
            has a come up, their stock price may skyrocket. The goal is to buy low and sell high. "}
		side="left"
		img_url="https://preview.redd.it/jason-balding-v0-d0btngl2depa1.png?auto=webp&s=a4e1f475dc5bb8ad79ecf80b742460fba994858f"
	/>
</div>
