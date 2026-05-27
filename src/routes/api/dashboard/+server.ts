import { json, type RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { ensureProfile, requireSupabaseUser } from '$lib/server/supabaseAuth';
import { getLegacyCourses, type ApiCourse } from '$lib/server/legacyCourse';

type LessonProgress = {
	status: string;
	progressPercentage: number;
	startedAt: Date | null;
	completedAt: Date | null;
	lastAccessedAt: Date | null;
};

type LessonCardSource = {
	id: string;
	title: string;
	contentUrl: string | null;
	userProgress: LessonProgress[];
	chapter: {
		id: string;
		title: string;
		chapterKey?: string | null;
		section?: string | null;
		orderIndex: number;
	};
};

function iconForTitle(title: string) {
	if (title.includes('長度')) return 'straighten';
	if (title.includes('體積')) return 'volume_measurement';
	if (title.includes('質量')) return 'balance';
	if (title.includes('密度')) return 'view_in_ar';
	if (title.includes('物質')) return 'bubble_chart';
	if (title.includes('水') || title.includes('溶液')) return 'opacity';
	if (title.includes('氣體')) return 'air';
	return 'science';
}

function latestDate(dates: Array<Date | null | undefined>) {
	return dates.filter(Boolean).sort((a, b) => b!.getTime() - a!.getTime())[0] ?? null;
}

function timeAgo(date: Date | null) {
	if (!date) return '尚未開始';

	const seconds = Math.max(1, Math.floor((Date.now() - date.getTime()) / 1000));
	if (seconds < 60) return '剛剛';

	const minutes = Math.floor(seconds / 60);
	if (minutes < 60) return `${minutes}分鐘前`;

	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours}小時前`;

	const days = Math.floor(hours / 24);
	if (days === 1) return '昨天';
	if (days < 7) return `${days}天前`;

	return date.toLocaleDateString('zh-TW');
}

function formatDate(date: Date) {
	return date.toLocaleDateString('zh-TW', {
		year: 'numeric',
		month: '2-digit',
		day: '2-digit'
	});
}

function formatDuration(seconds: number) {
	if (seconds <= 0) return '0分鐘';

	const minutes = Math.round(seconds / 60);
	if (minutes < 60) return `${minutes}分鐘`;

	const hours = Math.floor(minutes / 60);
	const restMinutes = minutes % 60;
	return restMinutes ? `${hours}小時${restMinutes}分鐘` : `${hours}小時`;
}

function progressAverage(lessons: LessonCardSource[]) {
	if (!lessons.length) return 0;
	const allCompleted = lessons.every(
		(lesson) => (lesson.userProgress[0]?.progressPercentage ?? 0) >= 100
	);
	return allCompleted ? 100 : 0;
}

function chapterStatus(lessons: LessonCardSource[]) {
	if (!lessons.length) return 'not_started';
	const progress = progressAverage(lessons);
	if (progress >= 100) return 'completed';
	
	// 只要有任何一個 lesson 有進度或已完成，該章節就視為「進行中」
	const hasStarted = lessons.some(
		(lesson) => 
			(lesson.userProgress[0]?.progressPercentage ?? 0) > 0 || 
			lesson.userProgress[0]?.status === 'in_progress' ||
			lesson.userProgress[0]?.status === 'completed'
	);
	
	return hasStarted ? 'in_progress' : 'not_started';
}

async function attachProgressByContentUrl(courses: ApiCourse[], userId: string) {
	const contentUrls = [
		...new Set(
			courses.flatMap((course) =>
				course.chapters.flatMap((chapter) =>
					chapter.lessons.map((lesson) => lesson.contentUrl).filter(Boolean)
				)
			)
		)
	] as string[];

	if (!contentUrls.length) return courses;

	const progressRows = await prisma.userProgress.findMany({
		where: {
			userId,
			lesson: {
				contentUrl: { in: contentUrls }
			}
		},
		include: { lesson: true }
	});
	const progressByContentUrl = new Map(
		progressRows
			.filter((progress) => progress.lesson.contentUrl)
			.map((progress) => [
				progress.lesson.contentUrl!,
				{
					status: progress.status,
					progressPercentage: progress.progressPercentage,
					startedAt: progress.startedAt,
					completedAt: progress.completedAt,
					lastAccessedAt: progress.lastAccessedAt
				}
			])
	);

	return courses.map((course) => ({
		...course,
		chapters: course.chapters.map((chapter) => ({
			...chapter,
			lessons: chapter.lessons.map((lesson) => {
				const progress = lesson.contentUrl
					? progressByContentUrl.get(lesson.contentUrl)
					: undefined;
				return progress ? { ...lesson, userProgress: [progress] } : lesson;
			})
		}))
	}));
}

export const GET: RequestHandler = async ({ request }) => {
	const user = await requireSupabaseUser(request);
	const profile = await ensureProfile(user);

	let courses = (await prisma.course.findMany({
		where: { isActive: true },
		orderBy: { createdAt: 'asc' },
		include: {
			chapters: {
				where: { isActive: true },
				orderBy: { orderIndex: 'asc' },
				include: {
					lessons: {
						where: { isActive: true },
						orderBy: { orderIndex: 'asc' },
						include: {
							userProgress: {
								where: { userId: user.id },
								take: 1
							}
						}
					}
				}
			}
		}
	})) as ApiCourse[];

	if (!courses.length) {
		courses = await attachProgressByContentUrl(await getLegacyCourses(), user.id);
	}

	const chapterDurations = await prisma.learningSession.groupBy({
		by: ['lessonId'],
		where: { userId: user.id },
		_sum: { duration: true }
	});
	const lessonDurationMap = new Map(
		chapterDurations.map((d) => [d.lessonId, d._sum.duration ?? 0])
	);

	const allChapterCards = courses.flatMap((course) =>
		course.chapters.map((chapter) => {
			const lessons = chapter.lessons.map((lesson) => ({
				...lesson,
				chapter: {
					id: chapter.id,
					title: chapter.title,
					chapterKey: chapter.chapterKey,
					section: chapter.section,
					orderIndex: chapter.orderIndex
				}
			}));

			const chapterDurationSeconds = lessons.reduce((total, lesson) => {
				return total + (lessonDurationMap.get(lesson.id) ?? 0);
			}, 0);

			return {
				id: chapter.id,
				title: chapter.title,
				chapterKey: chapter.chapterKey,
				progress: progressAverage(lessons),
				lastStudy: chapterDurationSeconds > 0 ? formatDuration(chapterDurationSeconds) : '尚未開始',
				icon: iconForTitle(chapter.title || course.title),
				href: lessons[0]?.contentUrl ?? '/1-1',
				status: chapterStatus(lessons)
			};
		})
	);

	const answers = await prisma.userAnswer.findMany({
		where: { userId: user.id },
		orderBy: { answeredAt: 'desc' },
		include: {
			quiz: true,
			question: true
		},
		take: 100
	});

	const scoreGroups = new Map<
		string,
		{
			id: string;
			title: string;
			score: number;
			maxScore: number;
			passingScore: number;
			answeredAt: Date;
		}
	>();

	for (const answer of answers) {
		const existing = scoreGroups.get(answer.quizId);
		const score = answer.score ?? 0;
		const maxScore = answer.question.score ?? 1;

		if (existing) {
			existing.score += score;
			existing.maxScore += maxScore;
			if (answer.answeredAt > existing.answeredAt) existing.answeredAt = answer.answeredAt;
		} else {
			scoreGroups.set(answer.quizId, {
				id: answer.quizId,
				title: answer.quiz.title,
				score,
				maxScore,
				passingScore: answer.quiz.passingScore,
				answeredAt: answer.answeredAt
			});
		}
	}

	const quizzes = await prisma.quiz.findMany({
		where: { isActive: true },
		orderBy: { createdAt: 'asc' },
		include: {
			chapter: true,
			questions: {
				orderBy: { orderIndex: 'asc' },
				include: {
					userAnswers: {
						where: { userId: user.id }
					}
				}
			}
		}
	});

	const allExamProgressData = quizzes.map((quiz) => {
		const totalCount = quiz.questions.length;
		const answeredCount = quiz.questions.filter((q) => q.userAnswers.length > 0).length;
		const wrongCount = quiz.questions.filter(
			(q) => q.userAnswers.length > 0 && q.userAnswers[0]?.isCorrect === false
		).length;

		const isPassed = totalCount > 0 && answeredCount === totalCount && wrongCount <= 1;
		const isFinished = totalCount > 0 && answeredCount === totalCount;
		const needsRetry = isFinished && !isPassed;

		const progress = isPassed ? 100 : 0;

		let formattedTitle = quiz.title;
		const match = formattedTitle.match(/(\d+-\d+\.\d+)/);
		if (match) {
			formattedTitle = `${match[1]} 測驗`;
		}

		const quizUrl = match ? `/test${match[1]}` : '/test1-1.1';

		return {
			id: quiz.id,
			title: formattedTitle,
			progress,
			isPassed,
			needsRetry,
			lastStudy: formatDuration(0),
			icon: iconForTitle(quiz.chapter.title),
			href: quizUrl
		};
	});

	// Helper to extract prefix (like "1-1" or "1-2") from any title/key
	function getUnitPrefix(name: string | null | undefined): string | null {
		if (!name) return null;
		const match = name.match(/(\d+-\d+)/);
		return match ? match[1] : null;
	}

	// 1. Gather all unique unit prefixes present in the courses
	const uniqueUnits = [...new Set(
		allChapterCards
			.map((c) => getUnitPrefix(c.chapterKey || c.title))
			.filter(Boolean) as string[]
	)].sort((a, b) => {
		const parseParts = (str: string) => str.split('-').map(Number);
		const [aMajor, aMinor] = parseParts(a);
		const [bMajor, bMinor] = parseParts(b);
		if (aMajor !== bMajor) return aMajor - bMajor;
		return aMinor - bMinor;
	});

	// 2. Compute completion status for each unique unit prefix
	const unitCompletionMap = new Map<string, boolean>();
	uniqueUnits.forEach((p) => {
		const pChapters = allChapterCards.filter((c) => {
			const prefix = getUnitPrefix(c.chapterKey || c.title);
			return prefix === p;
		});
		const isLessonsFinished = pChapters.length > 0 && pChapters.every((c) => c.progress >= 100);

		const pQuizzes = allExamProgressData.filter((q) => {
			const prefix = getUnitPrefix(q.title);
			return prefix === p;
		});
		const isQuizPassed = pQuizzes.length > 0 && pQuizzes.every((q) => q.isPassed);

		unitCompletionMap.set(p, isLessonsFinished && (pQuizzes.length === 0 || isQuizPassed));
	});

	// Helper to check if a specific unit prefix is unlocked
	function isUnitUnlocked(p: string | null): boolean {
		if (!p) return true;
		const index = uniqueUnits.indexOf(p);
		if (index <= 0) return true; // The very first unit is always unlocked

		// Check if ALL previous units in the list are completed
		for (let i = 0; i < index; i++) {
			const prevUnit = uniqueUnits[i];
			if (!unitCompletionMap.get(prevUnit)) {
				return false;
			}
		}
		return true;
	}

	// 根據單元解鎖狀態過濾課程與考試
	const chapterCards = allChapterCards.filter((card) => {
		const prefix = getUnitPrefix(card.chapterKey || card.title);
		return isUnitUnlocked(prefix);
	});

	const lessons = courses.flatMap((course) =>
		course.chapters.flatMap((chapter) =>
			chapter.lessons.map((lesson) => ({
				...lesson,
				chapter: {
					id: chapter.id,
					title: chapter.title,
					chapterKey: chapter.chapterKey,
					section: chapter.section,
					orderIndex: chapter.orderIndex
				}
			}))
		)
	);

	const currentLesson =
		lessons
			.filter((lesson) => lesson.userProgress.length > 0)
			.sort((a, b) => {
				const aDate = latestDate([
					a.userProgress[0]?.lastAccessedAt,
					a.userProgress[0]?.completedAt,
					a.userProgress[0]?.startedAt
				]);
				const bDate = latestDate([
					b.userProgress[0]?.lastAccessedAt,
					b.userProgress[0]?.completedAt,
					b.userProgress[0]?.startedAt
				]);
				return (bDate?.getTime() ?? 0) - (aDate?.getTime() ?? 0);
			})[0] ?? lessons[0];

	const examProgressData = allExamProgressData.filter((quiz) => {
		const prefix = getUnitPrefix(quiz.title);
		return isUnitUnlocked(prefix);
	});

	const examScores = [...scoreGroups.values()]
		.sort((a, b) => b.answeredAt.getTime() - a.answeredAt.getTime())
		.slice(0, 3)
		.map((group) => {
			const percent = group.maxScore ? Math.round((group.score / group.maxScore) * 100) : 0;
			
			let formattedTitle = group.title;
			const match = formattedTitle.match(/(\d+-\d+\.\d+)/);
			if (match) {
				formattedTitle = `${match[1]} 測驗`;
			}

			return {
				id: group.id,
				title: formattedTitle,
				score: percent,
				passed: percent >= group.passingScore,
				date: formatDate(group.answeredAt)
			};
		});

	const todayStart = new Date();
	todayStart.setHours(0, 0, 0, 0);

	const [totalSessionDuration, todaySessionDuration, wrongAnswerCount] = await Promise.all([
		prisma.learningSession.aggregate({
			where: { userId: user.id },
			_sum: { duration: true }
		}),
		prisma.learningSession.aggregate({
			where: {
				userId: user.id,
				startTime: { gte: todayStart }
			},
			_sum: { duration: true }
		}),
		prisma.userAnswer.count({
			where: {
				userId: user.id,
				isCorrect: false
			}
		})
	]);

	const totalDurationSeconds = totalSessionDuration._sum.duration ?? 0;
	const todayDurationSeconds = todaySessionDuration._sum.duration ?? 0;
	const dashboardStats = {
		totalStudyTime: formatDuration(totalDurationSeconds),
		todayStudyTime: formatDuration(todayDurationSeconds),
		wrongAnswerCount,
		wrongAnswerLabel: wrongAnswerCount > 0 ? `${wrongAnswerCount}題待複習` : '目前沒有錯題'
	};

	const getUnitKey = (title: string) => {
		const match = title.match(/^(\d+-\d+)/);
		return match ? match[1] : 'other';
	};

	const today = new Date();
	today.setHours(0, 0, 0, 0);

	// 收集每個單元的進度與最後完成時間
	const unitSummary = new Map<string, { progress: number; lastCompletedToday: boolean }>();
	
	const allItems = [
		...allChapterCards.map(c => ({ key: getUnitKey(c.title), progress: c.progress })),
		...allExamProgressData.map(q => ({ key: getUnitKey(q.title), progress: q.progress }))
	];

	// 重新計算每個單元的狀態
	const unitKeys = [...new Set(allItems.map(i => i.key))];
	unitKeys.forEach(key => {
		const chaptersInUnit = allChapterCards.filter(c => getUnitKey(c.title) === key);
		const quizzesInUnit = allExamProgressData.filter(q => getUnitKey(q.title) === key);
		
		const progress = (chaptersInUnit.every(c => c.progress >= 100) && quizzesInUnit.every(q => q.progress >= 100)) ? 100 : 0;
		
		// 檢查是否有任何項目是今天完成的
		let lastCompletedToday = false;
		
		// 檢查課程
		courses.forEach(course => {
			course.chapters.forEach(chapter => {
				if (getUnitKey(chapter.title) === key) {
					chapter.lessons.forEach(lesson => {
						const completedAt = lesson.userProgress[0]?.completedAt;
						if (completedAt && new Date(completedAt) >= today) lastCompletedToday = true;
					});
				}
			});
		});
		
		// 檢查測驗
		quizzes.forEach(quiz => {
			if (getUnitKey(quiz.title) === key) {
				quiz.questions.forEach(q => {
					q.userAnswers.forEach(a => {
						if (a.answeredAt && new Date(a.answeredAt) >= today) lastCompletedToday = true;
					});
				});
			}
		});

		unitSummary.set(key, { progress, lastCompletedToday });
	});

	// 決定活躍單元的邏輯：
	// 1. 先找「已開始但未完成」的單元
	// 2. 再找「今天剛完成」的單元 (為了讓它留在畫面上)
	// 3. 最後找「尚未開始」的單元
	let activeUnit = unitKeys.find(k => {
		const s = unitSummary.get(k);
		// 修正：將 chapters 改為 allChapterCards
		return s && s.progress < 100 && allChapterCards.some(c => getUnitKey(c.title) === k && c.progress > 0);
	});

	if (!activeUnit) {
		activeUnit = unitKeys.find(k => unitSummary.get(k)?.lastCompletedToday);
	}

	if (!activeUnit) {
		activeUnit = unitKeys.find(k => {
			const summary = unitSummary.get(k);
			return Boolean(summary && summary.progress < 100);
		});
	}

	activeUnit = activeUnit || '1-1';

	const dailyTasks = [
		...chapterCards
			.filter((c) => getUnitKey(c.title) === activeUnit)
			.map((chapter) => ({
				id: `lesson-${chapter.id}`,
				text: `完成 ${chapter.title}`,
				completed: chapter.progress >= 100,
				href: chapter.progress >= 100 ? undefined : chapter.href
			})),
		...examProgressData
			.filter((q) => getUnitKey(q.title) === activeUnit)
			.map((quiz) => {
				const match = quiz.title.match(/(\d+-\d+\.\d+)/);
				const quizUrl = match ? `/test${match[1]}` : '/test1-1.1';
				return {
					id: `quiz-${quiz.id}`,
					text: `完成 ${quiz.title}`,
					completed: quiz.progress >= 100,
					href: quiz.progress >= 100 ? undefined : quizUrl
				};
			})
	];

	if (dailyTasks.length === 0) {
		dailyTasks.push({
			id: 'lesson-review',
			text: '複習已完成課程',
			completed: true,
			href: '/1-1'
		});
	}

	const completedCount = chapterCards.filter((chapter) => chapter.status === 'completed').length;
	const overallStatus =
		chapterCards.length === 0
			? '尚未建立課程'
			: completedCount === chapterCards.length
				? '已完成'
				: completedCount > 0
					? '穩定推進中'
					: '準備開始';

	const currentChapterLabel =
		currentLesson?.chapter.section ??
		currentLesson?.chapter.chapterKey ??
		currentLesson?.chapter.title ??
		'1-1.1';
	const dashboardProgress = {
		currentLocation: currentLesson?.chapter.title ?? '尚未開始課程',
		currentChapterId: currentLesson?.chapter.id ?? '',
		currentChapterLabel,
		continueHref: currentLesson?.contentUrl ?? '/1-1',
		overallStatus
	};

	return json({
		user,
		profile,
		activeCourses: chapterCards,
		examProgressData,
		examScores,
		dailyTasks,
		dashboardProgress,
		dashboardStats,
		courses
	});
};
