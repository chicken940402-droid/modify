import { json, type RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { requireSupabaseUser } from '$lib/server/supabaseAuth';
import { normalizeQuizOptions } from '$lib/quiz/options';

function normalizeAnswer(value: unknown): string {
	if (Array.isArray(value)) {
		return value
			.map(String)
			.map((item) => item.trim())
			.sort()
			.join('|');
	}

	if (typeof value !== 'string') {
		return String(value ?? '').trim();
	}

	const trimmed = value.trim();
	try {
		const parsed = JSON.parse(trimmed);
		if (Array.isArray(parsed)) return normalizeAnswer(parsed);
	} catch {
		// Ignore parse errors
	}

	if (trimmed.includes(',')) {
		return trimmed
			.split(',')
			.map((item) => item.trim())
			.sort()
			.join('|');
	}

	return trimmed;
}

function answerLabel(answer: string, options: unknown) {
	const normalized = normalizeAnswer(answer);
	const option = normalizeQuizOptions(options).find(
		(item) => normalizeAnswer(item.id) === normalized || normalizeAnswer(item.text) === normalized
	);

	return option ? `${option.id}. ${option.text}` : answer;
}

export const GET: RequestHandler = async ({ url, request }) => {
	const user = await requireSupabaseUser(request);

	const chapterId = url.searchParams.get('chapterId') ?? undefined;

	const quizzes = await prisma.quiz.findMany({
		where: {
			isActive: true,
			...(chapterId ? { chapterId } : {})
		},
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

	const safeQuizzes = quizzes.map((quiz) => ({
		id: quiz.id,
		chapterId: quiz.chapterId,
		title: quiz.title,
		timeLimit: quiz.timeLimit,
		passingScore: quiz.passingScore,
		chapter: quiz.chapter,
		questions: quiz.questions.map((q) => {
			const hasAnswered = q.userAnswers.length > 0;
			return {
				id: q.id,
				quizId: q.quizId,
				questionText: q.questionText,
				questionImageUrl: q.questionImageUrl,
				questionType: q.questionType,
				options: q.options,
				score: q.score,
				orderIndex: q.orderIndex,
				userAnswers: q.userAnswers,
				// Return correctAnswer and explanation details only if user already answered
				...(hasAnswered ? {
					correctAnswer: q.correctAnswer,
					correctAnswerLabel: answerLabel(q.correctAnswer, q.options),
					explanation: q.explanation,
					explanationImageUrl: q.explanationImageUrl
				} : {})
			};
		})
	}));

	return json({ quizzes: safeQuizzes });
};
