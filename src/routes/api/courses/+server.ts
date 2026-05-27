import { json, type RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { getLegacyCourses } from '$lib/server/legacyCourse';

export const GET: RequestHandler = async () => {
	const courses = await prisma.course.findMany({
		where: { isActive: true },
		orderBy: { createdAt: 'asc' },
		include: {
			chapters: {
				where: { isActive: true },
				orderBy: { orderIndex: 'asc' },
				include: {
					lessons: {
						where: { isActive: true },
						orderBy: { orderIndex: 'asc' }
					}
				}
			}
		}
	});

	if (courses.length) {
		return json({ courses, source: 'courses' });
	}

	const legacyCourses = await getLegacyCourses();
	return json({ courses: legacyCourses, source: 'course_pages' });
};
