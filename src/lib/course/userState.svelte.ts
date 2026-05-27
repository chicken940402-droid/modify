import { authFetch, getStoredSession } from '$lib/supabase/auth';

export type UserRole = 'user' | 'premium' | 'admin';

export interface UserProfile {
	id: string;
	role: UserRole;
	displayName: string | null;
	createdAt: string;
}

export class UserState {
	profile = $state<UserProfile | null>(null);
	isLoading = $state(false);
	error = $state<string | null>(null);

	isPremium = $derived(this.profile?.role === 'premium' || this.profile?.role === 'admin');
	isAdmin = $derived(this.profile?.role === 'admin');

	async fetchProfile() {
		const session = getStoredSession();
		if (!session?.access_token) {
			this.profile = null;
			return null;
		}

		this.isLoading = true;
		this.error = null;

		try {
			const response = await authFetch('/api/profile');
			if (!response.ok) {
				throw new Error('無法取得使用者資料');
			}

			const data = await response.json();
			this.profile = data.profile;
			return this.profile;
		} catch (err: any) {
			this.error = err.message;
			return null;
		} finally {
			this.isLoading = false;
		}
	}

	clear() {
		this.profile = null;
	}
}

export const userState = new UserState();
