<script lang="ts">
	import { courseData1_2 as courseData } from '../data1_2';
	import { CourseState } from '$lib/course/courseState.svelte';
	import QuestionArea from '$lib/course/components/QuestionArea.svelte';
	import SimulatorDispatcher from '$lib/course/components/SimulatorDispatcher.svelte';
	import LearningSidebar from '$lib/course/components/LearningSidebar.svelte';
	import { endLearningSession, startLearningSession } from '$lib/course/learningTimer';
	import { syncCourseProgress } from '$lib/course/progressSync';
	import { onMount } from 'svelte';

	const courseState = new CourseState(courseData.lessons);

	let currentDistance = $state(0);
	let accumulatedPulls = $state(0);
	let isCorrect = $state(false);
	let showFeedback = $state(false);
	let learningSessionId: string | null = null;

	onMount(() => {
		startLearningSession('/1-1/1-1.2').then((sessionId) => {
			learningSessionId = sessionId;
		});

		return () => {
			void endLearningSession(learningSessionId);
			courseState.stopTimer();
		};
	});

	function handleCorrect() {
		isCorrect = true;
		showFeedback = true;
		courseState.unlock(courseState.currentStage.id);
		void syncCourseProgress('/1-1/1-1.2', 100, courseState.currentStage.id);

		if (courseState.next()) {
			// 跳轉成功
		}
	}

	$effect(() => {
		if (courseState.currentStageIndex >= 0) {
			currentDistance = 0;
			accumulatedPulls = 0;
			isCorrect = false;
			showFeedback = false;
		}
	});
</script>

<div class="relative min-h-screen bg-gray-50">
	<main class="flex flex-col items-center p-8 pb-32">
		<div class="flex w-full max-w-[1000px] flex-col">
			<QuestionArea {courseState} {isCorrect} {showFeedback} />

			<SimulatorDispatcher
				{courseState}
				bind:currentDistance
				bind:accumulatedPulls
				onCorrect={handleCorrect}
			/>
		</div>
	</main>

	<LearningSidebar {courseState} />
</div>

<style>
	main {
		width: 100%;
	}
</style>
