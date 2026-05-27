import { error, json, type RequestHandler } from '@sveltejs/kit';
import { normalizeQuizOptions } from '$lib/quiz/options';
import { prisma } from '$lib/server/prisma';
import { requireSupabaseUser } from '$lib/server/supabaseAuth';

function answerToText(answer: unknown) {
	if (typeof answer === 'string') return answer;
	return JSON.stringify(answer) ?? '';
}

function normalizeAnswer(value: unknown) {
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
		// Plain-text answers are expected for most current questions.
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

function answerCandidates(answer: unknown, options: unknown) {
	const candidates = new Set<string>();
	const answerText = answerToText(answer).trim();

	if (answerText) candidates.add(answerText);

	for (const option of normalizeQuizOptions(options)) {
		if (option.id === answerText || option.text === answerText) {
			candidates.add(option.id);
			candidates.add(option.text);
		}
	}

	return [...candidates];
}

function answerLabel(answer: string, options: unknown) {
	const normalized = normalizeAnswer(answer);
	const option = normalizeQuizOptions(options).find(
		(item) => normalizeAnswer(item.id) === normalized || normalizeAnswer(item.text) === normalized
	);

	return option ? `${option.id}. ${option.text}` : answer;
}

export const POST: RequestHandler = async ({ request }) => {
	const user = await requireSupabaseUser(request);

	const body = await request.json().catch(() => ({}));
	const questionId = typeof body.questionId === 'string' ? body.questionId : '';
	const quizId = typeof body.quizId === 'string' ? body.quizId : undefined;

	if (!questionId) {
		throw error(400, 'questionId 是必填欄位');
	}

	const question = await prisma.question.findUnique({
		where: { id: questionId },
		include: { quiz: true }
	});

	if (!question) {
		throw error(404, '找不到題目');
	}

	if (quizId && quizId !== question.quizId) {
		throw error(400, 'quizId 與 questionId 不一致');
	}

	const existing = await prisma.userAnswer.findUnique({
		where: {
			userId_questionId: {
				userId: user.id,
				questionId
			}
		}
	});

	if (existing) {
		return json(
			{
				message: '此題已經作答過',
				answer: existing,
				result: {
					isCorrect: existing.isCorrect,
					score: existing.score,
					correctAnswer: question.correctAnswer,
					correctAnswerLabel: answerLabel(question.correctAnswer, question.options),
					explanation: question.explanation,
					explanationImageUrl: question.explanationImageUrl
				}
			},
			{ status: 409 }
		);
	}

	const submittedAnswer = body.answer;
	const isCorrect = answerCandidates(submittedAnswer, question.options).some(
		(candidate) => normalizeAnswer(candidate) === normalizeAnswer(question.correctAnswer)
	);
	const score = isCorrect ? question.score : 0;

	const answer = await prisma.userAnswer.create({
		data: {
			userId: user.id,
			quizId: question.quizId,
			questionId,
			answer: answerToText(submittedAnswer),
			isCorrect,
			score
		}
	});

	return json(
		{
			answer,
			result: {
				isCorrect,
				score,
				correctAnswer: question.correctAnswer,
				correctAnswerLabel: answerLabel(question.correctAnswer, question.options),
				explanation: question.explanation,
				explanationImageUrl: question.explanationImageUrl
			}
		},
		{ status: 201 }
	);
};

export const DELETE: RequestHandler = async ({ url, request }) => {
	const user = await requireSupabaseUser(request);
	const quizId = url.searchParams.get('quizId');

	if (!quizId) {
		throw error(400, 'quizId 是必填欄位');
	}

	await prisma.userAnswer.deleteMany({
		where: {
			userId: user.id,
			quizId
		}
	});

	return json({ message: '測驗紀錄已重置' });
};
