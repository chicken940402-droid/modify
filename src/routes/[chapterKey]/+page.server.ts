import { error } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';

export const load = async ({ params }) => {
	const chapterKey = params.chapterKey;

	if (!chapterKey) {
		throw error(404, '找不到章節');
	}

	const chapter = await prisma.chapter.findUnique({
		where: { chapterKey },
		select: {
			id: true,
			title: true,
			chapterKey: true,
			section: true,
			lessons: {
				where: { isActive: true },
				orderBy: { orderIndex: 'asc' },
				select: {
					id: true,
					title: true,
					contentType: true,
					contentUrl: true,
					legacyLessonId: true,
					fullId: true,
					lessonType: true,
					simContent: true,
					contentText: true,
					orderIndex: true
				}
			}
		}
	});

	if (!chapter) {
		throw error(404, '找不到章節');
	}

	return { chapter };
};
