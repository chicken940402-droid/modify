<script lang="ts">
	import { uiTheme } from '../../../uiTheme.svelte';

	let {
		contentText,
		isQuizCorrect = $bindable(false)
	}: { contentText: string; isQuizCorrect: boolean } = $props();

	let userInput = $state('');
	let styles = $derived(uiTheme.styles);

	let quizParts = $derived.by(() => {
		if (!contentText) return null;
		const match = contentText.match(/^1\s*(.+?)\s*=\s*(.*)$/);
		if (match) {
			return { prefix: '1', answer: match[1].trim(), suffix: ' = ' + match[2].trim() };
		}
		return null;
	});

	$effect(() => {
		if (quizParts) {
			isQuizCorrect = userInput.trim() === quizParts.answer;
		}
	});
</script>

{#if quizParts}
	<div
		class="animate-in zoom-in-95 flex flex-col items-center gap-2 p-4 duration-300 {styles.quiz}"
	>
		<div class="flex items-baseline gap-3 text-3xl font-black {styles.text}">
			<span class="text-xl font-bold select-none">{quizParts.prefix}</span>
			<input
				type="text"
				bind:value={userInput}
				placeholder="???"
				class="w-32 py-1 text-center transition-all {styles.input}"
				class:correct={isQuizCorrect}
			/>
			<span class="text-xl font-bold select-none">{@html quizParts.suffix}</span>
		</div>
	</div>
{/if}

<style>
	input.correct {
		color: #10b981;
		border-color: #10b981;
		background-color: #f0fdf4;
	}
</style>
