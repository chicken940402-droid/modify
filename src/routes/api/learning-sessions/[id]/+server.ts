import { error, json, type RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { requireSupabaseUser } from '$lib/server/supabaseAuth';

export const PATCH: RequestHandler = async ({ params, request }) => {
	const user = await requireSupabaseUser(request);
	const id = params.id;

	if (!id) {
		throw error(400, 'session id 是必填欄位');
	}

	const existing = await prisma.learningSession.findFirst({
		where: {
			id,
			userId: user.id
		}
	});

	if (!existing) {
		throw error(404, '找不到學習紀錄');
	}

	const endTime = new Date();
	const duration = Math.max(
		0,
		Math.round((endTime.getTime() - existing.startTime.getTime()) / 1000)
	);

	const session = await prisma.learningSession.update({
		where: { id },
		data: {
			endTime,
			duration
		}
	});

	if (existing.lessonId) {
		await prisma.userProgress.updateMany({
			where: {
				userId: user.id,
				lessonId: existing.lessonId
			},
			data: {
				lastAccessedAt: endTime
			}
		});
	}

	return json({ session });
};
