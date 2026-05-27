import { authFetch } from '$lib/supabase/auth';

export async function syncCourseProgress(
	contentUrl: string,
	progressPercentage: number,
	legacyLessonId?: string
) {
	const progress = Math.max(0, Math.min(100, Math.round(progressPercentage)));
	const status = progress >= 100 ? 'completed' : progress > 0 ? 'in_progress' : 'not_started';

	try {
		await authFetch('/api/progress', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				contentUrl,
				legacyLessonId,
				progressPercentage: progress,
				status
			})
		});
	} catch {
		// Progress sync should not interrupt the simulator flow.
	}
}
