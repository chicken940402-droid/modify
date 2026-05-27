<script lang="ts">
	import type { CourseState } from '../../../courseState.svelte';
	import QuizInput from './QuizInput.svelte';

	let { courseState, onCorrect }: { courseState: CourseState; onCorrect: () => void } = $props();

	let currentStage = $derived(courseState.currentStage);
	let isQuizCorrect = $state(false);

	$effect(() => {
		if (isQuizCorrect && !courseState.isUnlocked(currentStage.id)) {
			// 純問答關卡答對後，立即觸發過關
			onCorrect();
		}
	});
</script>

<!-- 沿用與模擬區一致的置中佈局，但不重複外框，因為分派器已經提供外框 -->
<div
	class="animate-in fade-in zoom-in flex w-full flex-grow flex-col items-center justify-center p-8 duration-700"
>
	<div class="flex w-full max-w-2xl flex-col items-center gap-8">
		<!-- 這裡是核心問答，直接使用 QuizInput 以確保樣式 100% 相同 -->
		<QuizInput contentText={currentStage.contentText} bind:isQuizCorrect />
	</div>
</div>
