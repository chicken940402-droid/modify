<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { endLearningSession, startLearningSession } from '$lib/course/learningTimer';
	import { normalizeQuizOptions, type NormalizedQuizOption } from '$lib/quiz/options';
	import { authFetch, clearStoredSession, getStoredSession } from '$lib/supabase/auth';
	import { onMount } from 'svelte';

	type QuizOption = NormalizedQuizOption;

	type ApiQuestion = {
		id: string;
		quizId: string;
		questionText: string | null;
		questionImageUrl: string | null;
		questionType: string;
		options: unknown;
		score: number;
		orderIndex: number;
		userAnswers?: Array<{
			id: string;
			userId: string;
			quizId: string;
			questionId: string;
			answer: string | null;
			isCorrect: boolean | null;
			score: number | null;
			answeredAt: string;
		}>;
		correctAnswer?: string;
		correctAnswerLabel?: string;
		explanation?: string | null;
		explanationImageUrl?: string | null;
	};

	type ApiQuiz = {
		id: string;
		chapterId: string;
		title: string;
		timeLimit: number | null;
		passingScore: number;
		isActive?: boolean;
		questions: ApiQuestion[];
	};

	type AnswerResult = {
		isCorrect: boolean | null;
		score: number | null;
		correctAnswer?: string;
		correctAnswerLabel?: string;
		explanation?: string | null;
		explanationImageUrl?: string | null;
	};

	let quizzes = $state<ApiQuiz[]>([]);
	let quiz = $state<ApiQuiz | null>(null);
	let currentQuestionIndex = $state(0);
	let selectedOption = $state<string | null>(null);
	let result = $state<AnswerResult | null>(null);
	let isLoading = $state(true);
	let isStarting = $state(false);
	let isSubmitting = $state(false);
	let errorMessage = $state('');
	let noticeMessage = $state('');
	let learningSessionId: string | null = null;

	let currentQuestion = $derived(quiz?.questions[currentQuestionIndex] ?? null);
	let options = $derived(currentQuestion ? normalizeQuizOptions(currentQuestion.options) : []);
	let progressText = $derived(
		quiz && quiz.questions.length > 0
			? `${currentQuestionIndex + 1} / ${quiz.questions.length}`
			: ''
	);
	let isLastQuestion = $derived(quiz ? currentQuestionIndex >= quiz.questions.length - 1 : true);

	$effect(() => {
		if (currentQuestion) {
			const existingAnswer = currentQuestion.userAnswers?.[0];
			if (existingAnswer) {
				selectedOption = existingAnswer.answer;
				result = {
					isCorrect: existingAnswer.isCorrect,
					score: existingAnswer.score,
					correctAnswer: currentQuestion.correctAnswer,
					correctAnswerLabel: currentQuestion.correctAnswerLabel,
					explanation: currentQuestion.explanation,
					explanationImageUrl: currentQuestion.explanationImageUrl
				};
			} else {
				selectedOption = null;
				result = null;
			}
		}
	});

	function normalizeAnswer(value: unknown) {
		return String(value ?? '')
			.trim()
			.toLowerCase();
	}

	function shortQuizTitle(title: string) {
		const match = title.match(/(\d+-\d+\.\d+)/);
		return match?.[1] ?? title.replace('Gemini 單選題(核心概念) - ', '');
	}

	function formatQuizTitle(title: string) {
		const match = title.match(/(\d+-\d+\.\d+)/);
		return match ? `${match[1]} 測驗` : title;
	}

	function isCorrectOption(option: QuizOption) {
		if (!result?.correctAnswer) return false;

		const correctAnswer = normalizeAnswer(result.correctAnswer);
		const correctAnswerLabel = result.correctAnswerLabel ? normalizeAnswer(result.correctAnswerLabel) : '';

		return (
			normalizeAnswer(option.id) === correctAnswer ||
			normalizeAnswer(option.text) === correctAnswer ||
			(correctAnswerLabel !== '' && correctAnswerLabel.startsWith(`${normalizeAnswer(option.id)}.`))
		);
	}

	function isIncorrectOption(option: QuizOption) {
		return Boolean(result && result.isCorrect === false && selectedOption === option.id);
	}

	function resetQuestionState() {
		currentQuestionIndex = 0;
		selectedOption = null;
		result = null;
		noticeMessage = '';
		errorMessage = '';
	}
async function loadQuizzes() {
	const session = getStoredSession();
	if (!session?.access_token) {
		isLoading = false;
		errorMessage = '請先登入後再進入測驗。';
		return;
	}

	isLoading = true;
	errorMessage = '';

	try {
		const response = await authFetch('/api/quizzes');
		if (response.status === 401) {
			clearStoredSession();
			goto('/login');
			return;
		}
			const data = await response.json().catch(() => ({}));
			if (!response.ok) {
				throw new Error(data?.message || '無法取得測驗資料');
			}

			quizzes = ((data.quizzes ?? []) as ApiQuiz[]).filter(
				(item) => item.isActive !== false && item.questions?.length > 0
			);

			if (quizzes.length === 0) {
				errorMessage = '目前 API 沒有可作答的 A/B/C/D 題目。';
			} else {
				const targetQuizId = page.params.quizId;
				if (targetQuizId) {
					const matchedQuiz = quizzes.find((item) => item.title.includes(targetQuizId));
					if (matchedQuiz) {
						await chooseQuiz(matchedQuiz);
					} else {
						errorMessage = `找不到對應的測驗章節: ${targetQuizId}`;
					}
				}
			}
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : '無法取得測驗資料';
		} finally {
			isLoading = false;
		}
	}

	async function chooseQuiz(nextQuiz: ApiQuiz) {
		if (isStarting) return;

		isStarting = true;

		// Reset previous answers in DB to start fresh
		try {
			await authFetch(`/api/user-answers?quizId=${nextQuiz.id}`, {
				method: 'DELETE'
			});
			nextQuiz.questions.forEach((q) => {
				q.userAnswers = [];
			});
		} catch (err) {
			console.error('重置測驗紀錄失敗:', err);
		}

		await endLearningSession(learningSessionId);
		learningSessionId = null;

		quiz = nextQuiz;
		resetQuestionState();
		currentQuestionIndex = 0; // Always start at the first question

		try {
			learningSessionId = await startLearningSession(`/test${page.params.quizId || '1-1.1'}`, nextQuiz.id);
		} finally {
			isStarting = false;
		}
	}

	async function backToQuizSelection() {
		if (quiz) {
			try {
				// Reset answers in DB on exit
				await authFetch(`/api/user-answers?quizId=${quiz.id}`, {
					method: 'DELETE'
				});
				quiz.questions.forEach((q) => {
					q.userAnswers = [];
				});
			} catch (err) {
				console.error('重置測驗紀錄失敗:', err);
			}
		}
		await endLearningSession(learningSessionId);
		learningSessionId = null;
		quiz = null;
		resetQuestionState();
		goto('/main');
	}

	async function handleBack() {
		if (currentQuestionIndex === 0) {
			await backToQuizSelection();
		} else {
			currentQuestionIndex -= 1;
			selectedOption = null;
			result = null;
			noticeMessage = '';
			errorMessage = '';
		}
	}

	async function selectOption(option: QuizOption) {
		if (!quiz || !currentQuestion || result || isSubmitting) return;

		selectedOption = option.id;
		isSubmitting = true;
		noticeMessage = '';

		try {
			const response = await authFetch('/api/user-answers', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					quizId: quiz.id,
					questionId: currentQuestion.id,
					answer: option.id
				})
			});

			if (response.status === 401) {
				clearStoredSession();
				goto('/login');
				return;
			}

			const data = await response.json().catch(() => ({}));
			if (!response.ok && response.status !== 409) {
				throw new Error(data?.message || '答案送出失敗');
			}

			if (response.status === 409) {
				noticeMessage = data?.message || '此題已經作答過，顯示上次作答結果。';
			}

			result = data.result ?? {
				isCorrect: null,
				score: null,
				explanation: data?.message || '答案已送出。'
			};

			if (data.answer) {
				currentQuestion.userAnswers = [data.answer];
				currentQuestion.correctAnswer = data.result?.correctAnswer;
				currentQuestion.correctAnswerLabel = data.result?.correctAnswerLabel;
				currentQuestion.explanation = data.result?.explanation;
				currentQuestion.explanationImageUrl = data.result?.explanationImageUrl;
			}
		} catch (error) {
			selectedOption = null;
			errorMessage = error instanceof Error ? error.message : '答案送出失敗';
		} finally {
			isSubmitting = false;
		}
	}

	function goToNextQuestion() {
		if (!quiz || isLastQuestion) return;

		currentQuestionIndex += 1;
		selectedOption = null;
		result = null;
		noticeMessage = '';
		errorMessage = '';
	}

	onMount(() => {
		void loadQuizzes();

		return () => {
			void endLearningSession(learningSessionId);
		};
	});
</script>

<div class="relative flex min-h-screen items-center justify-center bg-white p-4 font-sans md:p-8">
	<button
		class="absolute top-4 left-4 md:top-8 md:left-8 rounded-lg bg-transparent p-1.5 transition-all hover:scale-110 active:scale-95 flex items-center justify-center text-[#5C3A21] z-50"
		onclick={handleBack}
		aria-label="返回"
	>
		<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
			<line x1="19" y1="12" x2="5" y2="12"></line>
			<polyline points="12 19 5 12 12 5"></polyline>
		</svg>
	</button>

	<div class="pixel-corners-outer w-full max-w-4xl bg-[#4A3000] p-[4px] drop-shadow-sm">
		<div
			class="pixel-corners-inner h-full w-full bg-[#E5D0B8] p-2 shadow-[inset_4px_4px_0_0_#FFF9F0,inset_-4px_-4px_0_0_#8B6F47]"
		>
			<div class="rounded-xl bg-[#EAD8C3] px-6 py-8 md:px-10 md:py-12">
				{#if isLoading}
					<div class="py-16 text-center text-lg font-extrabold tracking-wide text-[#3E2723]">
						測驗載入中...
					</div>
				{:else if errorMessage && quizzes.length === 0}
					<div class="space-y-6 py-12 text-center">
						<p class="text-xl font-extrabold text-[#3E2723]">{errorMessage}</p>
						<button
							class="rounded-xl bg-[#5C3A21] px-6 py-3 text-sm font-black tracking-widest text-white uppercase shadow-sm transition-all hover:bg-[#4A3000]"
							onclick={() => goto('/login')}
						>
							前往登入
						</button>
					</div>
				{:else if !quiz}
					<div class="space-y-8">
						<div class="space-y-2">
							<h1 class="text-3xl font-black tracking-tight text-[#3E2723]">選擇測驗章節</h1>
						</div>

						{#if errorMessage}
							<div
								class="rounded-xl border border-[#DDA3A3] bg-[#FCEAEA] px-5 py-3 text-sm font-bold text-[#8A2525]"
							>
								{errorMessage}
							</div>
						{/if}

						<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
							{#each quizzes as item}
								<button
									class="rounded-xl border-[1.5px] border-[#D1BFAE] bg-[#F7EFE5] p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:bg-[#EAE0D5] disabled:cursor-wait disabled:opacity-70"
									disabled={isStarting}
									onclick={() => chooseQuiz(item)}
								>
									<div class="mb-4 flex items-center justify-between gap-3">
										<span
											class="rounded-md bg-[#5C3A21] px-3 py-1 text-sm font-black text-white shadow-sm"
										>
											{shortQuizTitle(item.title)}
										</span>
										<span class="text-sm font-black text-[#5C3A21]">{item.questions.length} 題</span
										>
									</div>
									<p class="mt-3 text-sm font-bold text-[#6D4B36]">點選後開始此章節測驗</p>
								</button>
							{/each}
						</div>
					</div>
				{:else if quiz && currentQuestion}
					<div
						class="mb-8 flex items-center justify-between gap-4 text-sm font-black text-[#5C3A21]"
					>
						<div class="w-[44px]"></div>
						<span>{formatQuizTitle(quiz.title)}</span>
						<span>{progressText}</span>
					</div>

					<div class="mb-8 flex flex-col gap-4 md:mb-10 md:flex-row md:items-start md:gap-5">
						<div
							class="mt-1 inline-block min-w-[40px] shrink-0 rounded-md bg-[#5C3A21] px-3 py-1 text-center text-base font-medium text-white shadow-sm"
						>
							中
						</div>
						<div class="space-y-4">
							<h2
								class="text-lg leading-relaxed font-extrabold tracking-wide text-[#3E2723] md:text-xl lg:text-2xl"
							>
								{currentQuestion.questionText || '未命名題目'}
							</h2>
						</div>
					</div>

					{#if currentQuestion.questionImageUrl}
						<div class="mb-8 flex justify-center">
							<img
								src={currentQuestion.questionImageUrl}
								alt="題目圖片"
								class="max-h-80 rounded-xl border border-[#D1BFAE] object-contain shadow-sm"
							/>
						</div>
					{/if}

					{#if errorMessage}
						<div
							class="mx-auto mb-5 w-11/12 rounded-xl border border-[#DDA3A3] bg-[#FCEAEA] px-5 py-3 text-sm font-bold text-[#8A2525] md:w-[90%]"
						>
							{errorMessage}
						</div>
					{/if}

					{#if noticeMessage}
						<div
							class="mx-auto mb-5 w-11/12 rounded-xl border border-[#D1BFAE] bg-[#F7EFE5] px-5 py-3 text-sm font-bold text-[#5C3A21] md:w-[90%]"
						>
							{noticeMessage}
						</div>
					{/if}

					<div class="mx-auto w-11/12 space-y-4 md:w-[90%]">
						{#each options as option}
							{@const showAsCorrect = isCorrectOption(option)}
							{@const showAsIncorrect = isIncorrectOption(option)}

							<button
								class="group flex w-full items-center rounded-xl border-[1.5px] shadow-sm transition-all duration-200 {showAsCorrect
									? 'border-[#9BC79B] bg-[#E6F3E6]'
									: showAsIncorrect
										? 'border-[#DDA3A3] bg-[#FCEAEA]'
										: `border-[#D1BFAE] bg-[#F7EFE5] ${result || isSubmitting ? '' : 'cursor-pointer hover:bg-[#EAE0D5]'}`}"
								disabled={Boolean(result) || isSubmitting}
								onclick={() => selectOption(option)}
							>
								<div
									class="flex w-16 justify-center py-2 text-xl font-bold md:w-20 md:py-3 md:text-2xl {showAsCorrect
										? 'text-[#2D5A3B]'
										: showAsIncorrect
											? 'text-[#A32A2A]'
											: `text-[#4E342E] ${result || isSubmitting ? '' : 'group-hover:text-[#5C3A21]'}`}"
								>
									{option.id}
								</div>
								<div
									class="h-6 w-[1.5px] md:h-8 {showAsCorrect
										? 'bg-[#9BC79B]'
										: showAsIncorrect
											? 'bg-[#DDA3A3]'
											: 'bg-[#D1BFAE]'}"
								></div>
								<div
									class="flex-1 px-4 py-2 text-left text-lg font-medium md:px-6 md:py-3 md:text-xl {showAsCorrect
										? 'text-[#1C5024]'
										: showAsIncorrect
											? 'text-[#8A2525]'
											: 'text-[#4E342E]'}"
								>
									{option.text}
								</div>
								{#if option.imageUrl}
									<img
										src={option.imageUrl}
										alt=""
										class="mr-4 h-12 w-12 shrink-0 rounded-lg border border-[#D1BFAE] object-cover md:mr-6 md:h-14 md:w-14"
									/>
								{/if}

								{#if showAsCorrect}
									<div class="flex items-center justify-center pr-4 md:pr-6">
										<div
											class="flex h-6 w-6 items-center justify-center rounded-full bg-[#2F683E] text-white md:h-7 md:w-7"
										>
											<svg
												xmlns="http://www.w3.org/2000/svg"
												class="h-4 w-4 md:h-5 md:w-5"
												viewBox="0 0 20 20"
												fill="currentColor"
											>
												<path
													fill-rule="evenodd"
													d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
													clip-rule="evenodd"
												/>
											</svg>
										</div>
									</div>
								{/if}
								{#if showAsIncorrect}
									<div class="flex items-center justify-center pr-4 md:pr-6">
										<div
											class="flex h-6 w-6 items-center justify-center rounded-full bg-[#B33A3A] text-white md:h-7 md:w-7"
										>
											<svg
												xmlns="http://www.w3.org/2000/svg"
												class="h-4 w-4 md:h-5 md:w-5"
												viewBox="0 0 20 20"
												fill="currentColor"
											>
												<path
													fill-rule="evenodd"
													d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
													clip-rule="evenodd"
												/>
											</svg>
										</div>
									</div>
								{/if}
							</button>
						{/each}
					</div>

					{#if result}
						<div
							class="mx-auto mt-6 w-11/12 rounded-xl border-[1.5px] border-[#D1BFAE] bg-[#F7EFE5] px-6 py-6 shadow-sm md:w-[90%]"
						>
							<div class="flex items-start gap-4">
								<div
									class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#3F6E4D] text-white shadow-sm md:h-9 md:w-9"
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										width="18"
										height="18"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="2"
										stroke-linecap="round"
										stroke-linejoin="round"
									>
										<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
									</svg>
								</div>
								<div class="space-y-3 w-full">
									{#if result.isCorrect}
										<div class="inline-flex items-center gap-2 rounded-lg bg-emerald-100 px-3 py-1 text-sm font-black text-emerald-800 border border-emerald-300 shadow-sm">
											<svg class="h-4 w-4 shrink-0 text-emerald-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
												<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
											</svg>
											答對了！
										</div>
									{:else if result.isCorrect === false}
										<div class="inline-flex items-center gap-2 rounded-lg bg-rose-100 px-3 py-1 text-sm font-black text-rose-800 border border-rose-300 shadow-sm">
											<svg class="h-4 w-4 shrink-0 text-rose-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
												<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
											</svg>
											答錯了！
										</div>
									{/if}

									<h3 class="text-xl font-bold text-[#3E2723]">答案解析</h3>
									{#if result.correctAnswerLabel}
										<p class="text-base font-bold text-[#3F6E4D]">
											正確答案：{result.correctAnswerLabel}
										</p>
									{/if}
									<p class="text-lg leading-relaxed text-[#4E342E]">
										{result.explanation || '此題尚未提供解析。'}
									</p>
									{#if result.explanationImageUrl}
										<img
											src={result.explanationImageUrl}
											alt="解析圖片"
											class="mt-4 max-h-80 rounded-xl border border-[#D1BFAE] object-contain shadow-sm"
										/>
									{/if}
								</div>
							</div>
						</div>

						<div class="mx-auto mt-6 flex w-11/12 justify-end gap-4 md:w-[90%]">
							{#if isLastQuestion}
								<button
									class="rounded-xl bg-[#5C3A21] px-6 py-3 text-sm font-black tracking-widest text-white uppercase shadow-sm transition-all hover:bg-[#4A3000]"
									onclick={backToQuizSelection}
								>
									完成測驗
								</button>
							{:else}
								<button
									class="rounded-xl bg-[#5C3A21] px-6 py-3 text-sm font-black tracking-widest text-white uppercase shadow-sm transition-all hover:bg-[#4A3000]"
									onclick={goToNextQuestion}
								>
									下一題
								</button>
							{/if}
						</div>
					{/if}
				{:else}
					<div class="py-16 text-center text-lg font-extrabold tracking-wide text-[#3E2723]">
						測驗資料不存在。
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>

<style>
	.pixel-corners-outer {
		clip-path: polygon(
			8px 0,
			calc(100% - 8px) 0,
			calc(100% - 8px) 4px,
			calc(100% - 4px) 4px,
			calc(100% - 4px) 8px,
			100% 8px,
			100% calc(100% - 8px),
			calc(100% - 4px) calc(100% - 8px),
			calc(100% - 4px) calc(100% - 4px),
			calc(100% - 8px) calc(100% - 4px),
			calc(100% - 8px) 100%,
			8px 100%,
			8px calc(100% - 4px),
			4px calc(100% - 4px),
			4px calc(100% - 8px),
			0 calc(100% - 8px),
			0 8px,
			4px 8px,
			4px 4px,
			8px 4px
		);
	}

	.pixel-corners-inner {
		clip-path: polygon(
			4px 0,
			calc(100% - 4px) 0,
			calc(100% - 4px) 4px,
			100% 4px,
			100% calc(100% - 4px),
			calc(100% - 4px) calc(100% - 4px),
			calc(100% - 4px) 100%,
			4px 100%,
			4px calc(100% - 4px),
			0 calc(100% - 4px),
			0 4px,
			4px 4px
		);
	}
</style>
