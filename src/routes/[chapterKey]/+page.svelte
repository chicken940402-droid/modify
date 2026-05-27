<script lang="ts">
	import { onMount } from 'svelte';
	import { endLearningSession, startLearningSession } from '$lib/course/learningTimer';
	import { syncCourseProgress } from '$lib/course/progressSync';

	let { data } = $props();
	let learningSessionId: string | null = null;
	let completedLessonIds = $state(new Set<string>());

	const chapterPath = `/${data.chapter.chapterKey}`;

	onMount(() => {
		startLearningSession(chapterPath).then((sessionId) => {
			learningSessionId = sessionId;
		});

		return () => {
			void endLearningSession(learningSessionId);
		};
	});

	function completeLesson(lessonId: string, legacyLessonId: string | null) {
		completedLessonIds = new Set([...completedLessonIds, lessonId]);
		void syncCourseProgress(chapterPath, 100, legacyLessonId ?? undefined);
	}
</script>

<div class="min-h-screen bg-[#F7EFE2] text-[#4A3000]">
	<header
		class="sticky top-0 z-20 border-b border-[#4A3000]/10 bg-[#F7EFE2]/95 px-6 py-4 backdrop-blur"
	>
		<div class="mx-auto flex max-w-5xl items-center justify-between gap-4">
			<a
				href="/main"
				class="inline-flex items-center gap-2 text-sm font-black tracking-widest text-[#8B6F47] uppercase"
			>
				<span class="material-icons text-base">arrow_back</span>
				返回主頁
			</a>
			<span class="text-xs font-black tracking-widest uppercase opacity-50"
				>{data.chapter.section ?? data.chapter.chapterKey}</span
			>
		</div>
	</header>

	<main class="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-10">
		<section class="space-y-2">
			<p class="text-sm font-black tracking-widest text-[#8B6F47] uppercase">Supabase Lessons</p>
			<h1 class="text-3xl font-black tracking-tight">{data.chapter.title}</h1>
		</section>

		{#if data.chapter.lessons.length === 0}
			<section
				class="rounded-2xl border border-dashed border-[#4A3000]/20 bg-[#FFF9F0] p-8 text-center"
			>
				<p class="font-black opacity-50">這個章節還沒有匯入 lesson。</p>
			</section>
		{:else}
			<section class="grid grid-cols-1 gap-4">
				{#each data.chapter.lessons as lesson}
					<article
						class="rounded-2xl border border-[#4A3000]/5 bg-[#FFF9F0] p-6 shadow-[0_8px_20px_rgba(74,48,0,0.05)]"
					>
						<div class="flex flex-col gap-5">
							<div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
								<div class="flex flex-wrap items-center gap-2">
									<span class="rounded-lg bg-[#EADBC8] px-3 py-1 text-xs font-black text-[#4A3000]"
										>{lesson.fullId ?? lesson.legacyLessonId}</span
									>
									{#if lesson.lessonType}
										<span
											class="rounded-lg bg-[#8B6F47]/10 px-3 py-1 text-xs font-black text-[#8B6F47]"
											>{lesson.lessonType}</span
										>
									{/if}
								</div>

								<button
									onclick={() => completeLesson(lesson.id, lesson.legacyLessonId)}
									class="shrink-0 rounded-xl px-5 py-3 text-xs font-black tracking-widest uppercase shadow-[0_4px_12px_rgba(74,48,0,0.12)] transition-all active:scale-[0.98]
										{completedLessonIds.has(lesson.id)
										? 'bg-[#5F6349] text-white'
										: 'bg-[#8B6F47] text-white hover:bg-[#745B3A]'}"
								>
									{completedLessonIds.has(lesson.id) ? '已完成' : '完成'}
								</button>
							</div>

							<div class="grid grid-cols-1 gap-3 lg:grid-cols-3">
								<section class="rounded-xl border border-[#4A3000]/5 bg-white/45 p-4">
									<p class="mb-2 text-[10px] font-black tracking-widest text-[#8B6F47] uppercase">
										指令區
									</p>
									<h2 class="text-base leading-7 font-black">{lesson.title}</h2>
								</section>

								<section class="rounded-xl border border-[#4A3000]/5 bg-white/45 p-4">
									<p class="mb-2 text-[10px] font-black tracking-widest text-[#8B6F47] uppercase">
										模擬區
									</p>
									<p class="text-sm leading-7 font-bold whitespace-pre-line opacity-70">
										{lesson.simContent || '待設計'}
									</p>
								</section>

								<section class="rounded-xl border border-[#8B6F47]/15 bg-[#EADBC8]/60 p-4">
									<p class="mb-2 text-[10px] font-black tracking-widest text-[#8B6F47] uppercase">
										課文
									</p>
									<p class="text-sm leading-7 font-black whitespace-pre-line text-[#4A3000]">
										{lesson.contentText || '待補課文'}
									</p>
								</section>
							</div>
						</div>
					</article>
				{/each}
			</section>
		{/if}
	</main>
</div>
