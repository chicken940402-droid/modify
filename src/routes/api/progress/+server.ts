import { error, json, type RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { requireSupabaseUser } from '$lib/server/supabaseAuth';

const validStatuses = new Set(['not_started', 'in_progress', 'completed']);

function clampProgress(value: unknown) {
	const number = typeof value === 'number' && Number.isFinite(value) ? value : 0;
	return Math.max(0, Math.min(100, Math.round(number)));
}

export const GET: RequestHandler = async ({ request }) => {
	const user = await requireSupabaseUser(request);

	const progress = await prisma.userProgress.findMany({
		where: { userId: user.id },
		orderBy: { updatedAt: 'desc' },
		include: {
			lesson: {
				include: {
					chapter: {
						include: {
							course: true
						}
					}
				}
			}
		}
	});

	return json({ progress });
};

export const POST: RequestHandler = async ({ request }) => {
	const user = await requireSupabaseUser(request);
	const body = await request.json().catch(() => ({}));
	const lessonId = typeof body.lessonId === 'string' ? body.lessonId : '';
	const contentUrl = typeof body.contentUrl === 'string' ? body.contentUrl : '';
	const legacyLessonId = typeof body.legacyLessonId === 'string' ? body.legacyLessonId : '';
	const status = typeof body.status === 'string' ? body.status : 'in_progress';
	const progressPercentage =
		status === 'completed' ? 100 : clampProgress(body.progressPercentage ?? body.progress);

	if (!lessonId && !contentUrl) {
		throw error(400, 'lessonId 或 contentUrl 是必填欄位');
	}

	if (!validStatuses.has(status)) {
		throw error(400, 'status 必須是 not_started、in_progress 或 completed');
	}

	const lesson = lessonId
		? await prisma.lesson.findUnique({ where: { id: lessonId } })
		: legacyLessonId
			? await prisma.lesson.findFirst({
					where: {
						contentUrl,
						legacyLessonId
					},
					orderBy: { createdAt: 'asc' }
				})
			: await prisma.lesson.findFirst({
					where: { contentUrl },
					orderBy: { createdAt: 'asc' }
				});

	if (!lesson) {
		throw error(404, '找不到課程單元');
	}

	const now = new Date();
	const existing = await prisma.userProgress.findUnique({
		where: {
			userId_lessonId: {
				userId: user.id,
				lessonId: lesson.id
			}
		}
	});
	const nextProgressPercentage = progressPercentage >= 100 ? 100 : 0;
	const nextStatus =
		nextProgressPercentage >= 100
			? 'completed'
			: 'not_started';

	const progress = existing
		? await prisma.userProgress.update({
				where: { id: existing.id },
				data: {
					status: nextStatus,
					progressPercentage: nextProgressPercentage,
					lastAccessedAt: now,
					completedAt:
						nextStatus === 'completed' ? (existing.completedAt ?? now) : existing.completedAt
				}
			})
		: await prisma.userProgress.create({
				data: {
					userId: user.id,
					lessonId: lesson.id,
					status: nextStatus,
					progressPercentage: nextProgressPercentage,
					startedAt: nextStatus === 'not_started' ? null : now,
					completedAt: nextStatus === 'completed' ? now : null,
					lastAccessedAt: now
				}
			});

	return json({ progress });
};
