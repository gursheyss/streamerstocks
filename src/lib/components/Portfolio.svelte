<script lang="ts">
	interface Props {
		balance: number;
		balanceHistory: History[];
	}

	interface History {
		date: string;
		balance: number;
	}
	let { balance, balanceHistory }: Props = $props();
</script>
