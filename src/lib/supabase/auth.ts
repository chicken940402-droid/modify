import { PUBLIC_SUPABASE_PUBLISHABLE_KEY, PUBLIC_SUPABASE_URL } from '$env/static/public';

const supabaseUrl = PUBLIC_SUPABASE_URL.replace(/\/$/, '');
const supabaseKey = PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const localStorageKey = 'supabase_session';
const legacyTokenKey = 'auth_token';
const legacyEmailKey = 'user_email';

export interface SupabaseAuthUser {
	id: string;
	email?: string;
	user_metadata?: Record<string, unknown>;
}

export interface SupabaseAuthSession {
	access_token: string;
	refresh_token?: string;
	expires_in?: number;
	token_type?: string;
	user?: SupabaseAuthUser;
}

function getBrowserStorage() {
	if (typeof window === 'undefined') return null;
	return { local: window.localStorage, session: window.sessionStorage };
}

function getAuthHeaders(token?: string) {
	const headers: Record<string, string> = {
		apikey: supabaseKey,
		'Content-Type': 'application/json'
	};

	if (token) {
		headers.Authorization = `Bearer ${token}`;
	} else {
		headers.Authorization = `Bearer ${supabaseKey}`;
	}

	return headers;
}

async function parseAuthResponse<T>(response: Response): Promise<T> {
	const data = await response.json().catch(() => ({}));

	if (!response.ok) {
		const message =
			data?.msg || data?.message || data?.error_description || data?.error || 'Supabase 驗證失敗';
		throw new Error(message);
	}

	return data as T;
}

function persistSession(session: SupabaseAuthSession, remember = true) {
	const storage = getBrowserStorage();
	if (!storage) return;

	const target = remember ? storage.local : storage.session;
	const other = remember ? storage.session : storage.local;

	target.setItem(localStorageKey, JSON.stringify(session));
	target.setItem(legacyTokenKey, session.access_token);
	if (session.user?.email) target.setItem(legacyEmailKey, session.user.email);

	other.removeItem(localStorageKey);
	other.removeItem(legacyTokenKey);
	if (remember) other.removeItem(legacyEmailKey);
}

export function getStoredSession(): SupabaseAuthSession | null {
	const storage = getBrowserStorage();
	if (!storage) return null;

	for (const target of [storage.local, storage.session]) {
		const raw = target.getItem(localStorageKey);
		if (raw) {
			try {
				return JSON.parse(raw) as SupabaseAuthSession;
			} catch {
				target.removeItem(localStorageKey);
			}
		}

		const legacyToken = target.getItem(legacyTokenKey);
		if (legacyToken) {
			return {
				access_token: legacyToken,
				user: { id: 'd4d1e6d8-9f8d-4fa4-bea1-bcdf04bb9c32', email: target.getItem(legacyEmailKey) ?? undefined }
			};
		}
	}

	return null;
}

export function clearStoredSession() {
	const storage = getBrowserStorage();
	if (!storage) return;

	for (const target of [storage.local, storage.session]) {
		target.removeItem(localStorageKey);
		target.removeItem(legacyTokenKey);
		target.removeItem(legacyEmailKey);
	}
}

export async function signInWithPassword(email: string, password: string, remember = true) {
	const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
		method: 'POST',
		headers: getAuthHeaders(),
		body: JSON.stringify({ email, password })
	});
	const session = await parseAuthResponse<SupabaseAuthSession>(response);
	persistSession(session, remember);
	await ensureProfile();
	return session;
}

export async function signUpWithPassword(email: string, password: string, remember = true) {
	const response = await fetch(`${supabaseUrl}/auth/v1/signup`, {
		method: 'POST',
		headers: getAuthHeaders(),
		body: JSON.stringify({
			email,
			password,
			data: { display_name: email.split('@')[0] }
		})
	});
	const session = await parseAuthResponse<
		Partial<SupabaseAuthSession> & { user?: SupabaseAuthUser }
	>(response);

	if (session.access_token) {
		persistSession(session as SupabaseAuthSession, remember);
		await ensureProfile();
	}

	return session;
}

export function signInWithGoogle() {
	const redirectUrl = window.location.origin + '/login';
	window.location.href = `${supabaseUrl}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirectUrl)}`;
}

export async function handleOAuthCallback() {
	if (typeof window === 'undefined') return false;
	const hash = window.location.hash;
	if (hash && hash.includes('access_token')) {
		const params = new URLSearchParams(hash.substring(1));
		const access_token = params.get('access_token');
		const refresh_token = params.get('refresh_token');
		const expires_in = parseInt(params.get('expires_in') || '0', 10);
		
		if (access_token) {
			const session: SupabaseAuthSession = {
				access_token,
				refresh_token: refresh_token || undefined,
				expires_in
			};
			persistSession(session, true);
			
			// Clean up the URL
			window.history.replaceState(null, '', window.location.pathname);
			
			await ensureProfile();
			return true;
		}
	}
	return false;
}

export async function signOut() {
	const session = getStoredSession();

	if (session?.access_token) {
		await fetch(`${supabaseUrl}/auth/v1/logout`, {
			method: 'POST',
			headers: getAuthHeaders(session.access_token)
		}).catch(() => undefined);
	}

	clearStoredSession();
}

export async function getCurrentUser() {
	const session = getStoredSession();
	if (!session?.access_token) return null;

	try {
		const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
			headers: getAuthHeaders(session.access_token)
		});

		if (!response.ok) return null;

		return await parseAuthResponse<SupabaseAuthUser>(response);
	} catch (err) {
		return null;
	}
}

export async function ensureProfile() {
	const response = await authFetch('/api/profile', { method: 'POST' });
	if (!response.ok) {
		throw new Error('無法同步使用者資料');
	}
	return response.json();
}

export async function authFetch(input: RequestInfo | URL, init: RequestInit = {}) {
	const session = getStoredSession();
	const headers = new Headers(init.headers);

	if (session?.access_token) {
		headers.set('Authorization', `Bearer ${session.access_token}`);
	}

	return fetch(input, {
		...init,
		headers
	});
}
