import { prisma } from './prisma';

type LegacyCoursePage = {
	chapter_key: string;
	section: string | null;
	title: string;
	updated_at: Date | null;
};

type LegacyCourseLesson = {
	id: bigint | number | string;
	chapter_key: string;
	sort_order: number;
	lesson_id: string;
	full_id: string | null;
	lesson_type: string;
	question: string;
	simulator_id: string | null;
	simulator_config: unknown;
	sim_content: string | null;
	content_text: string | null;
	updated_at: Date | null;
};

export type ApiLesson = {
	id: string;
	chapterId: string;
	title: string;
	contentType: string | null;
	contentUrl: string | null;
	simulatorConfig: unknown;
	orderIndex: number;
	isActive: boolean;
	createdAt: Date;
	fullId?: string | null;
	lessonType?: string;
	question?: string;
	simContent?: string | null;
	contentText?: string | null;
	userProgress: Array<{
		status: string;
		progressPercentage: number;
		startedAt: Date | null;
		completedAt: Date | null;
		lastAccessedAt: Date | null;
	}>;
};

export type ApiChapter = {
	id: string;
	courseId: string;
	title: string;
	description: string | null;
	orderIndex: number;
	isActive: boolean;
	createdAt: Date;
	chapterKey?: string;
	section?: string | null;
	lessons: ApiLesson[];
};

export type ApiCourse = {
	id: string;
	title: string;
	description: string | null;
	isActive: boolean;
	createdAt: Date;
	chapters: ApiChapter[];
};

const defaultDate = new Date(0);

function toDate(value: Date | string | null | undefined) {
	if (!value) return defaultDate;
	return value instanceof Date ? value : new Date(value);
}

function lessonToApi(row: LegacyCourseLesson): ApiLesson {
	const chapterId = `legacy-${row.chapter_key}`;
	const lessonKey = row.lesson_id || String(row.id);

	return {
		id: `legacy-${row.chapter_key}-${lessonKey}`,
		chapterId,
		title: row.question,
		contentType: row.simulator_id ? 'simulation' : 'text',
		contentUrl: `/${row.chapter_key}`,
		simulatorConfig: row.simulator_config,
		orderIndex: Number(row.sort_order ?? 0),
		isActive: true,
		createdAt: toDate(row.updated_at),
		fullId: row.full_id,
		lessonType: row.lesson_type,
		question: row.question,
		simContent: row.sim_content,
		contentText: row.content_text,
		userProgress: []
	};
}

export async function getLegacyCourses(): Promise<ApiCourse[]> {
	const pages = await prisma.$queryRaw<LegacyCoursePage[]>`
		select chapter_key, section, title, updated_at
		from public.course_pages
		order by chapter_key
	`;

	if (!pages.length) return [];

	const lessons = await prisma.$queryRaw<LegacyCourseLesson[]>`
		select id, chapter_key, sort_order, lesson_id, full_id, lesson_type, question,
		       simulator_id, simulator_config, sim_content, content_text, updated_at
		from public.course_lessons
		order by chapter_key, sort_order
	`;

	const lessonsByChapter = new Map<string, ApiLesson[]>();
	for (const lesson of lessons) {
		const list = lessonsByChapter.get(lesson.chapter_key) ?? [];
		list.push(lessonToApi(lesson));
		lessonsByChapter.set(lesson.chapter_key, list);
	}

	return [
		{
			id: 'legacy-physics-course',
			title: '理化課程',
			description: 'Supabase course_pages / course_lessons',
			isActive: true,
			createdAt: toDate(pages[0]?.updated_at),
			chapters: pages.map((page, index) => ({
				id: `legacy-${page.chapter_key}`,
				courseId: 'legacy-physics-course',
				title: `${page.chapter_key} ${page.title}`,
				description: null,
				orderIndex: index + 1,
				isActive: true,
				createdAt: toDate(page.updated_at),
				chapterKey: page.chapter_key,
				section: page.section,
				lessons: lessonsByChapter.get(page.chapter_key) ?? []
			}))
		}
	];
}

export async function getLegacyLesson(lessonId: string) {
	const normalizedId = lessonId.startsWith('legacy-')
		? lessonId
				.replace(/^legacy-/, '')
				.split('-')
				.slice(2)
				.join('-')
		: lessonId;

	const rows = await prisma.$queryRaw<LegacyCourseLesson[]>`
		select id, chapter_key, sort_order, lesson_id, full_id, lesson_type, question,
		       simulator_id, simulator_config, sim_content, content_text, updated_at
		from public.course_lessons
		where lesson_id = ${normalizedId}
		   or concat('legacy-', chapter_key, '-', lesson_id) = ${lessonId}
		order by sort_order
		limit 1
	`;

	return rows[0] ? lessonToApi(rows[0]) : null;
}
