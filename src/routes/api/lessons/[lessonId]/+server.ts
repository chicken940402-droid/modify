import { error, json, type RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { getLegacyLesson } from '$lib/server/legacyCourse';

export const GET: RequestHandler = async ({ params }) => {
	const lessonId = params.lessonId;
	if (!lessonId) {
		throw error(400, 'lessonId 是必填欄位');
	}

	const normalizedLegacyId = lessonId.startsWith('legacy-')
		? lessonId
				.replace(/^legacy-/, '')
				.split('-')
				.slice(2)
				.join('-')
		: lessonId;

	const lesson = await prisma.lesson.findFirst({
		where: {
			isActive: true,
			OR: [{ id: lessonId }, { legacyLessonId: normalizedLegacyId }, { fullId: lessonId }]
		},
		include: {
			chapter: {
				include: {
					course: true
				}
			}
		}
	});

	if (lesson) {
		return json({ lesson, source: 'lessons' });
	}

	const legacyLesson = await getLegacyLesson(lessonId);
	if (legacyLesson) {
		return json({ lesson: legacyLesson, source: 'course_lessons' });
	}

	throw error(404, '找不到課程單元');
};
