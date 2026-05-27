<script lang="ts">
	import { fade } from 'svelte/transition';
	import type { CourseState } from '../courseState.svelte';
	import { uiTheme } from '../uiTheme.svelte';
	import RulerSimulator from './simulators/ruler/RulerSimulator.svelte';
	import QuizSimulator from './simulators/quiz/QuizSimulator.svelte';
	import QuizInput from './simulators/quiz/QuizInput.svelte';
	import MathRenderer from './Math.svelte';

	import PixelButton from './PixelButton.svelte';

	let {
		courseState,
		currentDistance = $bindable(0),
		accumulatedPulls = $bindable(0),
		onCorrect
	}: {
		courseState: CourseState;
		currentDistance: number;
		accumulatedPulls: number;
		onCorrect: () => void;
	} = $props();

	let currentStage = $derived(courseState.currentStage);
	let styles = $derived(uiTheme.styles);

	let isActionCorrect = $state(false);
	let isQuizCorrect = $state(false);
	let showQuizDelayed = $state(false);
	let resetTrigger = $state(0);

	$effect(() => {
		if (currentStage.id) {
			isActionCorrect = false;
			isQuizCorrect = false;
			showQuizDelayed = false;

			if (currentStage.simContent || currentStage.simulator?.id === 'QUIZ_UNIT') {
				isActionCorrect = true;
			}
		}
	});

	$effect(() => {
		if (isActionCorrect) {
			const timer = setTimeout(() => {
				showQuizDelayed = true;
			}, 600);
			return () => clearTimeout(timer);
		} else {
			showQuizDelayed = false;
		}
	});

	$effect(() => {
		if (isActionCorrect && isQuizCorrect && !courseState.isUnlocked(currentStage.id)) {
			onCorrect();
		}
	});
</script>

<section
	class="simulator-area relative flex flex-grow flex-col overflow-hidden transition-all duration-300 {styles.container}"
>
	{#key currentStage.id}
		<div
			class="flex flex-grow flex-col p-4"
			in:fade={{ duration: 500, delay: 500 }}
			out:fade={{ duration: 500 }}
		>
			<!-- 推導文字區 -->
			{#if currentStage.simContent}
				<div class="flex flex-grow items-center justify-center p-6">
					<div class="inline-block p-10 {styles.board}">
						<MathRenderer formula={currentStage.simContent} />
					</div>
				</div>
			{/if}

			{#if currentStage.simulator}
				{#if currentStage.simulator.id.startsWith('RULER')}
					<RulerSimulator
						{courseState}
						bind:currentDistance
						bind:accumulatedPulls
						bind:isActionCorrect
						{resetTrigger}
						onCorrect={() => (isActionCorrect = true)}
					/>

					{#if showQuizDelayed && !courseState.isUnlocked(currentStage.id)}
						<div class="absolute bottom-8 left-1/2 z-30 w-auto -translate-x-1/2">
							<QuizInput contentText={currentStage.contentText} bind:isQuizCorrect />
						</div>
					{/if}
				{:else if currentStage.simulator.id === 'QUIZ_UNIT'}
					{#if !currentStage.simContent}
						<QuizSimulator {courseState} {onCorrect} />
					{:else if showQuizDelayed && !courseState.isUnlocked(currentStage.id)}
						<div class="mt-4 flex justify-center pb-8">
							<QuizInput contentText={currentStage.contentText} bind:isQuizCorrect />
						</div>
					{/if}
				{/if}
			{/if}
		</div>
	{/key}

	<!-- 底部工具欄區 -->
	<div
		class="pointer-events-none absolute right-[34px] bottom-[30px] left-4 z-50 flex items-center justify-between"
	>
		<!-- 左側：功能按鈕 -->
		<div class="pointer-events-auto">
			{#if currentStage.simulator?.id.startsWith('RULER') && currentStage.simulator?.id !== 'RULER_STATIC'}
				<PixelButton size="sm" color="default" onclick={() => resetTrigger++}>清除重作</PixelButton>
			{/if}
		</div>
		<!-- 右側：開發者工具 -->
		<div class="pointer-events-auto flex items-center gap-[18px]">
			<PixelButton
				size="xs"
				color="default"
				onclick={() => courseState.next()}
				title="開發者專用：跳到下一關"
			>
				SKIP STAGE >>
			</PixelButton>
		</div>
	</div>
</section>

<style>
	.simulator-area {
		display: grid;
		grid-template-columns: 1fr;
		grid-template-rows: 1fr;
	}
	.simulator-area > :global(div) {
		grid-column: 1;
		grid-row: 1;
	}
</style>
