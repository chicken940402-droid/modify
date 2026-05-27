import { authFetch } from '$lib/supabase/auth';

export async function startLearningSession(contentUrl: string, quizId?: string) {
	try {
		const body: any = { contentUrl };
		if (quizId) body.quizId = quizId;

		const response = await authFetch('/api/learning-sessions', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body)
		});

		if (!response.ok) return null;

		const data = await response.json();
		return typeof data.session?.id === 'string' ? data.session.id : null;
	} catch {
		return null;
	}
}

export async function endLearningSession(sessionId: string | null) {
	if (!sessionId) return;

	try {
		await authFetch(`/api/learning-sessions/${sessionId}`, {
			method: 'PATCH'
		});
	} catch {
		// Timing data should never block the learning page.
	}
}
