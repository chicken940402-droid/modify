import { error, json, type RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { requireSupabaseUser } from '$lib/server/supabaseAuth';

export const POST: RequestHandler = async ({ request }) => {
	const user = await requireSupabaseUser(request);
	const body = await request.json().catch(() => ({}));
	const lessonId = typeof body.lessonId === 'string' ? body.lessonId : '';
	const quizId = typeof body.quizId === 'string' ? body.quizId : '';
	const contentUrl = typeof body.contentUrl === 'string' ? body.contentUrl : '';

	if (!lessonId && !contentUrl && !quizId) {
		throw error(400, 'lessonId, contentUrl 或 quizId 是必填欄位');
	}

	if (quizId) {
		const quiz = await prisma.quiz.findUnique({ where: { id: quizId } });
		if (!quiz) throw error(404, '找不到測驗');

		const session = await prisma.learningSession.create({
			data: {
				userId: user.id,
				quizId: quiz.id,
				startTime: new Date()
			}
		});

		return json({ session }, { status: 201 });
	}

	const lesson = lessonId
		? await prisma.lesson.findUnique({ where: { id: lessonId } })
		: await prisma.lesson.findFirst({
				where: { contentUrl },
				orderBy: { createdAt: 'asc' }
			});

	if (!lesson) {
		throw error(404, '找不到課程單元');
	}

	const session = await prisma.learningSession.create({
		data: {
			userId: user.id,
			lessonId: lesson.id,
			startTime: new Date()
		}
	});

	await prisma.userProgress.upsert({
		where: {
			userId_lessonId: {
				userId: user.id,
				lessonId: lesson.id
			}
		},
		update: {
			status: 'in_progress',
			lastAccessedAt: new Date()
		},
		create: {
			userId: user.id,
			lessonId: lesson.id,
			status: 'in_progress',
			progressPercentage: 0,
			startedAt: new Date(),
			lastAccessedAt: new Date()
		}
	});

	return json({ session }, { status: 201 });
};
