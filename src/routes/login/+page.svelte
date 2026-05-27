<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { getStoredSession, signInWithPassword, signUpWithPassword, signInWithGoogle, handleOAuthCallback } from '$lib/supabase/auth';

	// 提示訊息
	let errorMessage = $state('');
	let successMessage = $state('');

	onMount(async () => {
		// 檢查是否為 OAuth 返回
		try {
			const isOAuth = await handleOAuthCallback();
			if (isOAuth) {
				successMessage = 'Google 登入成功！正在導向...';
				setTimeout(() => goto('/main'), 800);
				return;
			}
		} catch (err: any) {
			errorMessage = err.message || 'Google 登入失敗';
		}

		// 檢查是否已經登入
		const session = getStoredSession();
		if (session?.access_token) {
			goto('/main');
		}
	});
</script>

<div
	class="flex min-h-screen items-center justify-center bg-[#F0E6D8] p-6 font-sans text-[#4A3000]"
>
	<div
		class="w-full max-w-md rounded-3xl bg-[#FFF9F0] p-8 shadow-[0_20px_50px_rgba(74,48,0,0.1)] transition-all"
		in:fly={{ y: 20, duration: 600 }}
	>
		<!-- 標題區域 -->
		<div class="mt-12 mb-10 text-center">
			<div
				class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#4A3000] shadow-lg"
			>
				<span class="material-icons text-3xl text-[#EADBC8]">school</span>
			</div>
			<h1 class="text-2xl font-black tracking-tight uppercase">
				歡迎來到智學
			</h1>
			<p class="text-sm font-medium opacity-60">
				開啟你的理化探索之旅
			</p>
		</div>

		<!-- 提示訊息區 -->
		{#if errorMessage}
			<div
				transition:fade
				class="mb-6 flex items-center gap-2 rounded-xl border border-red-200 bg-red-100 p-4 text-xs font-bold text-red-600"
			>
				<span class="material-icons text-sm">error</span>
				{errorMessage}
			</div>
		{/if}

		{#if successMessage}
			<div
				transition:fade
				class="mb-6 flex items-center gap-2 rounded-xl border border-green-200 bg-green-100 p-4 text-xs font-bold text-green-600"
			>
				<span class="material-icons text-sm">check_circle</span>
				{successMessage}
			</div>
		{/if}

		<div class="mt-4 text-center">
			<button
				type="button"
				onclick={signInWithGoogle}
				class="mb-6 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-[#E0CCB3] bg-[#EADBC8] py-3 text-sm font-black tracking-widest text-[#4A3000] uppercase transition-all outline-none shadow-[0_4px_20px_rgba(74,48,0,0.08)] hover:shadow-[0_8px_25px_rgba(74,48,0,0.12)] hover:-translate-y-0.5 hover:bg-[#E0CCB3] active:scale-[0.98] active:translate-y-0"
			>
				<svg class="h-5 w-5" viewBox="0 0 24 24">
					<path
						d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
						fill="#4285F4"
					/>
					<path
						d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
						fill="#34A853"
					/>
					<path
						d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
						fill="#FBBC05"
					/>
					<path
						d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
						fill="#EA4335"
					/>
				</svg>
				使用GOOGLE登入
			</button>
		</div>
	</div>
</div>

<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />

<style>
	:global(body) {
		background-color: #eadbc8;
		margin: 0;
	}

	input:focus {
		box-shadow: 0 10px 20px rgba(74, 48, 0, 0.05);
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}
	.animate-spin {
		animation: spin 1s linear infinite;
	}
	.border-3 {
		border-width: 3px;
	}
</style>
