<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { courseData } from './data';
	import { CourseState } from '$lib/course/courseState.svelte';
	import { globalProgress } from '$lib/course/globalProgress.svelte';
	import { userState } from '$lib/course/userState.svelte';
	import { getStoredSession } from '$lib/supabase/auth';
	import QuestionArea from '$lib/course/components/QuestionArea.svelte';
	import SimulatorDispatcher from '$lib/course/components/SimulatorDispatcher.svelte';
	import LearningSidebar from '$lib/course/components/LearningSidebar.svelte';
	import { endLearningSession, startLearningSession } from '$lib/course/learningTimer';
	import { syncCourseProgress } from '$lib/course/progressSync';

	const courseState = new CourseState(courseData.lessons);
	const CHAPTER_ID = '1';

	let isPageReady = $state(false);
	let currentDistance = $state(0);
	let accumulatedPulls = $state(0);
	let isCorrect = $state(false);
	let showFeedback = $state(false);
	let learningSessionId: string | null = null;
	let isChapterCompleted = $derived(globalProgress.getChapterStatus(CHAPTER_ID) === 'COMPLETED');
	let bottomObserver: HTMLElement | null = null;

	function completeChapter() {
		if (isChapterCompleted) return;
		void syncCourseProgress('/1-1', 100);
		globalProgress.markChapterComplete(CHAPTER_ID);
	}

	function handleCorrect() {
		isCorrect = true;
		showFeedback = true;
		// 延遲一下讓使用者看到正確回饋再跳下一關
		setTimeout(() => {
			courseState.next();
		}, 800);
	}

	async function checkAccessAndInit() {
		try {
			// 1. 檢查是否登入
			const session = getStoredSession();
			if (!session?.access_token) {
				window.location.href = '/login';
				return false;
			}

			// 2. 取得使用者資料
			await userState.fetchProfile();
			
			// 3. 初始化頁面與請求相關資料/Session
			globalProgress.updateCurrentChapter(CHAPTER_ID);
			learningSessionId = await startLearningSession('/1-1');
			isPageReady = true;
			return true;
		} catch (error) {
			console.error('初始化失敗:', error);
			window.location.href = '/login';
			return false;
		}
	}

	onMount(() => {
		let observer: IntersectionObserver | null = null;

		checkAccessAndInit().then((success) => {
			if (success) {
				// 確保 DOM 已經更新
				setTimeout(() => {
					if (bottomObserver) {
						observer = new IntersectionObserver(
							(entries) => {
								if (entries[0].isIntersecting && isPageReady) {
									completeChapter();
								}
							},
							{ threshold: 0.1 }
						);
						observer.observe(bottomObserver);
					}
				}, 100);
			}
		});

		return () => {
			if (observer) observer.disconnect();
			if (learningSessionId) void endLearningSession(learningSessionId);
			courseState.stopTimer();
		};
	});

	// 監聽關卡變化以重置狀態
	$effect(() => {
		// 讀取 courseState.currentStageIndex 來追蹤變化
		const index = courseState.currentStageIndex;
		if (index >= 0) {
			currentDistance = 0;
			accumulatedPulls = 0;
			isCorrect = false;
			showFeedback = false;
		}
	});

	function handleBack() {
		if (courseState.currentStageIndex === 0) {
			window.location.href = '/main';
		} else {
			courseState.prev();
		}
	}
</script>

<div class="relative flex min-h-screen flex-col bg-gray-50">
	{#if !isPageReady}
		<div class="flex flex-grow items-center justify-center bg-[#F0E6D8]">
			<div class="flex flex-col items-center gap-4">
				<div
					class="h-12 w-12 animate-spin rounded-full border-4 border-[#8B6F47]/20 border-t-[#8B6F47]"
				></div>
				<p class="text-sm font-black tracking-widest text-[#8B6F47] uppercase">權限驗證中...</p>
			</div>
		</div>
	{:else}
		<!-- 返回箭頭 -->
		<button
			onclick={handleBack}
			class="absolute top-8 left-8 z-50 cursor-pointer p-2 text-gray-500 transition-colors hover:text-[#4A3000]"
			aria-label="返回"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="32"
				height="32"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2.5"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<line x1="19" y1="12" x2="5" y2="12"></line>
				<polyline points="12 19 5 12 12 5"></polyline>
			</svg>
		</button>

		<main class="flex w-full flex-grow flex-col items-center justify-center p-8">
			<div class="flex w-full max-w-[1000px] flex-col gap-6">
				<QuestionArea {courseState} {isCorrect} {showFeedback} />

				<SimulatorDispatcher
					{courseState}
					bind:currentDistance
					bind:accumulatedPulls
					onCorrect={handleCorrect}
				/>
			</div>
		</main>

		<!-- 用於觸發方式 (2) 的底標 -->
		<div bind:this={bottomObserver} class="h-4 w-full"></div>

		<LearningSidebar {courseState} />
	{/if}
</div>

<style>
	main {
		width: 100%;
	}
</style>
