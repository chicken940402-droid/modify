<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import { uiTheme } from '$lib/course/uiTheme.svelte';
	import { userState } from '$lib/course/userState.svelte';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { authFetch, clearStoredSession, getStoredSession, signOut } from '$lib/supabase/auth';

	type CourseCard = {
		id: string;
		title: string;
		progress: number;
		lastStudy: string;
		icon: string;
		href?: string;
		needsRetry?: boolean;
	};

	type ExamScore = {
		id: string;
		title: string;
		score: number;
		passed: boolean;
		date: string;
	};

	type DailyTask = {
		id: string;
		text: string;
		completed: boolean;
		href?: string;
	};

	type DashboardStats = {
		totalStudyTime: string;
		todayStudyTime: string;
		wrongAnswerCount: number;
		wrongAnswerLabel: string;
	};

	let activeTab = $state('dashboard');
	let styles = $derived(uiTheme.styles);
	let isDashboardLoading = $state(true);
	let apiError = $state('');
	let currentUserEmail = $state('user@gmail.com');

	async function handleLogout() {
		await signOut();
		userState.clear();
		goto('/login');
	}

	const mainNavItems = [
		{ id: 'dashboard', label: '個人儀錶板', icon: 'dashboard' },
		{ id: 'physics-chemistry', label: '理化課程', icon: 'science' },
		{ id: 'exam-progress', label: '考試專區', icon: 'assignment' }
	];

	const bottomNavItems = [
		{ id: 'settings', label: '設定', icon: 'settings' },
		{ id: 'logout', label: '登出', icon: 'logout', href: '/login' }
	];

	let activeCourses = $state<CourseCard[]>([]);
	let displayedCourses = $state<CourseCard[]>([]);
	let examProgressData = $state<CourseCard[]>([]);
	let dashboardProgress = $state({
		currentLocation: '1-1 長度與體積的測量',
		currentChapterId: '1',
		currentChapterLabel: '1-1.1',
		continueHref: '/1-1',
		overallStatus: '穩定推進中'
	});
	let dashboardStats = $state<DashboardStats>({
		totalStudyTime: '0分鐘',
		todayStudyTime: '0分鐘',
		wrongAnswerCount: 0,
		wrongAnswerLabel: '目前沒有錯題'
	});
	let examScores = $state<ExamScore[]>([]);
	let dailyTasks = $state<DailyTask[]>([]);

	function toggleTask(id: string) {
		const task = dailyTasks.find((t) => t.id === id);
		if (task) task.completed = !task.completed;
	}

	function localProgressForCourse(course: CourseCard) {
		return course.progress;
	}

	function lastStudyForCourse(course: CourseCard, progress: number) {
		if (course.lastStudy !== '尚未開始' || progress <= 0) return course.lastStudy;
		return progress >= 100 ? '已完成' : '進行中';
	}

	function applyCourseProgress(courses: CourseCard[]) {
		const withProgress = courses.map((course) => {
			const progress = localProgressForCourse(course);

			return {
				...course,
				progress,
				lastStudy: lastStudyForCourse(course, progress)
			};
		});

		activeCourses = withProgress;
		displayedCourses = withProgress.map((course) => ({ ...course, progress: 0 }));

		requestAnimationFrame(() => {
			displayedCourses = withProgress;
		});
	}

	async function loadDashboard() {
		const session = getStoredSession();
		if (!session?.access_token) {
			goto('/login');
			return;
		}

		currentUserEmail =
			session.user?.email || localStorage.getItem('user_email') || currentUserEmail;
		isDashboardLoading = true;
		apiError = '';

		try {
			const response = await authFetch('/api/dashboard');
			if (response.status === 401) {
				clearStoredSession();
				goto('/login');
				return;
			}
			if (!response.ok) {
				throw new Error('資料同步失敗');
			}

			const data = await response.json();
			if (data.profile) userState.profile = data.profile;
			applyCourseProgress(data.activeCourses ?? []);
			examProgressData = data.examProgressData ?? [];
			examScores = data.examScores ?? [];
			dailyTasks = data.dailyTasks ?? [];
			dashboardProgress = {
				...dashboardProgress,
				...(data.dashboardProgress ?? {})
			};
			dashboardStats = {
				...dashboardStats,
				...(data.dashboardStats ?? {})
			};
			currentUserEmail = data.user?.email ?? currentUserEmail;
			localStorage.setItem('user_email', currentUserEmail);
		} catch (err: any) {
			apiError = err.message || '資料同步失敗';
		} finally {
			isDashboardLoading = false;
		}
	}

	onMount(() => {
		loadDashboard();
	});
</script>

<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />

<div
	class="flex min-h-screen flex-col bg-[#F0E6D8] font-sans text-[#4A3000] selection:bg-[#8B6F47] selection:text-[#EADBC8]"
>
	<!-- 全域頂部導航 -->
	<nav
		class="sticky top-0 z-50 flex items-center justify-between border-b-2 border-[#4A3000]/10 bg-[#FFF9F0]/80 px-8 py-4 backdrop-blur-md"
	>
		<div class="flex items-center gap-3">
			<div
				class="flex h-10 w-10 items-center justify-center bg-[#4A3000] shadow-[4px_4px_0_0_rgba(0,0,0,0.2)]"
			>
				<span class="material-icons text-[#EADBC8]">school</span>
			</div>
			<div class="flex flex-col">
				<span class="text-xl leading-none font-black tracking-tighter uppercase">智學系統</span>
				<span class="text-[8px] font-black tracking-widest uppercase opacity-40"
					>Smart Learning System v2.0</span
				>
			</div>
		</div>
		<div class="flex items-center gap-6 font-black tracking-widest">
			<div class="flex flex-col items-end">
				<div class="flex items-center gap-2">
					{#if userState.isPremium}
						<span
							class="rounded bg-amber-500 px-1.5 py-0.5 text-[8px] text-white shadow-[1px_1px_0_0_#000]"
							>PREMIUM</span
						>
					{/if}
					<span class="text-[10px] leading-none uppercase opacity-40">目前登入</span>
				</div>
				<span class="text-xs text-[#4A3000] normal-case">{currentUserEmail}</span>
			</div>
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				onclick={() => (activeTab = 'dashboard')}
				class="h-10 w-10 cursor-pointer overflow-hidden rounded-full bg-[#EADBC8] transition-all hover:scale-110 active:scale-95 shadow-sm"
			>
				<img
					src="https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka"
					alt="avatar"
					class="h-full w-full object-cover"
				/>
			</div>
		</div>
	</nav>

	<div class="mx-auto grid w-full max-w-7xl grid-cols-1 gap-12 p-8 lg:grid-cols-12">
		<!-- 左側導航欄 -->
		<aside class="space-y-8 lg:col-span-3">
			<div
				class="rounded-2xl border border-[#4A3000]/5 bg-[#FFF9F0] p-6 shadow-[0_8px_20px_rgba(74,48,0,0.05)]"
			>
				<p class="mb-6 text-center text-[16px] font-black tracking-widest uppercase opacity-60">
					功能選單
				</p>
				<nav class="flex flex-col gap-4">
					{#each mainNavItems as item}
						<button
							onclick={() => (activeTab = item.id)}
							class="relative flex w-full cursor-pointer items-center gap-3 rounded-xl border-none px-4 py-3 shadow-none transition-all select-none active:translate-y-[1px]
							{activeTab === item.id
								? 'bg-[#8B6F47] text-white'
								: 'bg-[#EADBC8] text-[#4b3324] hover:bg-[#DCCAB3]'}"
						>
							<div
								class="flex h-8 w-8 shrink-0 items-center justify-center {activeTab === item.id
									? 'text-white'
									: 'text-[#4b3324]/40'}"
							>
								<span class="material-icons text-xl">{item.icon}</span>
							</div>
							<span class="text-sm font-black tracking-widest uppercase">{item.label}</span>
						</button>
					{/each}
				</nav>

				<div class="mt-8 flex flex-col gap-4 border-t-2 border-[#4A3000]/10 pt-6">
					{#each bottomNavItems as item}
						{#if item.id === 'logout'}
							<button
								onclick={handleLogout}
								class="relative flex w-full cursor-pointer items-center gap-3 rounded-xl border-none bg-[#EADBC8] px-4 py-3 text-[#4b3324] shadow-none transition-all
								select-none hover:bg-[#DCCAB3] active:translate-y-[1px]"
							>
								<div class="flex h-8 w-8 shrink-0 items-center justify-center text-[#4b3324]/40">
									<span class="material-icons text-xl">{item.icon}</span>
								</div>
								<span class="text-sm font-black tracking-widest uppercase">{item.label}</span>
							</button>
						{:else}
							<button
								onclick={() => (activeTab = item.id)}
								class="relative flex w-full cursor-pointer items-center gap-3 rounded-xl border-none px-4 py-3 shadow-none transition-all select-none active:translate-y-[1px]
								{activeTab === item.id
									? 'bg-[#8B6F47] text-white'
									: 'bg-[#EADBC8] text-[#4b3324] hover:bg-[#DCCAB3]'}"
							>
								<div
									class="flex h-8 w-8 shrink-0 items-center justify-center {activeTab === item.id
										? 'text-white'
										: 'text-[#4b3324]/40'}"
								>
									<span class="material-icons text-xl">{item.icon}</span>
								</div>
								<span class="text-sm font-black tracking-widest uppercase">{item.label}</span>
							</button>
						{/if}
					{/each}
				</div>
			</div>
		</aside>

		<!-- 中央主內容區 -->
		<main class="space-y-12 lg:col-span-9">
			<!-- 課程內容切換區 -->
			<section class="space-y-6">
				{#if apiError}
					<div
						class="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-600"
					>
						{apiError}
					</div>
				{:else if isDashboardLoading}
					<div
						class="rounded-2xl border border-[#4A3000]/10 bg-[#FFF9F0] px-5 py-4 text-sm font-black opacity-60"
					>
						資料同步中...
					</div>
				{/if}

				{#if activeTab === 'exam-progress'}
					<div class="flex items-center justify-between">
						<h3 class="text-3xl font-black tracking-tighter uppercase" in:fade={{ duration: 300 }}>
							當前考試進度
						</h3>
					</div>

					<div class="grid grid-cols-1 gap-6" in:fly={{ y: 20, duration: 400 }}>
						{#each examProgressData as course}
							<div
								class="group flex flex-col items-center gap-8 rounded-2xl bg-[#FFF9F0] p-6 shadow-[0_8px_20px_rgba(74,48,0,0.05)] transition-all hover:translate-y-[-2px] hover:shadow-[0_12px_25px_rgba(74,48,0,0.08)] md:flex-row"
							>
								<div
									class="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-[#EADBC8]"
								>
									{#if course.icon === 'volume_measurement'}
										<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" viewBox="0 0 24 24" fill="currentColor">
											<path d="M5 21h14v2H5z" />
											<path fill-rule="evenodd" d="M8 2h8v19H8V2zm1.5 1.5h5V19h-5V3.5z" clip-rule="evenodd" />
											<rect x="9.5" y="10" width="5" height="9" />
											<rect x="9.5" y="5" width="2" height="1" />
											<rect x="9.5" y="7.5" width="1.5" height="1" />
											<rect x="9.5" y="10" width="2" height="1" />
											<rect x="9.5" y="12.5" width="1.5" height="1" />
											<rect x="9.5" y="15" width="2" height="1" />
										</svg>
									{:else}
										<span class="material-icons text-3xl">{course.icon}</span>
									{/if}
								</div>
								<div class="w-full flex-grow space-y-2">
									<div class="flex items-end justify-between">
										<h4 class="text-xl font-black uppercase">{course.title}</h4>
										<span class="text-xs font-black italic opacity-40"
											>考試時長：{course.lastStudy}</span
										>
									</div>
									<!-- 圓弧進度條 (加粗) -->
									<div
										class="relative h-5 w-full overflow-hidden rounded-full bg-[#EADBC8] shadow-[0_0_10px_rgba(0,0,0,0.05)]"
									>
										<div
											class="h-full rounded-full bg-[#8B6F47] transition-all duration-1000"
											style="width: {course.progress}%"
										>
											<div
												class="absolute inset-0 opacity-20"
												style="background-image: linear-gradient(45deg, #FFF 25%, transparent 25%, transparent 50%, #FFF 50%, #FFF 75%, transparent 75%, transparent); background-size: 10px 10px;"
											></div>
										</div>
										<span
											class="absolute top-1/2 right-4 -translate-y-1/2 text-xs font-black text-[#4A3000] drop-shadow-sm"
											>{course.progress}%</span
										>
									</div>
								</div>
								<button
									onclick={() => {
										goto(course.href || '/test1-1.1');
									}}
									class="rounded-xl bg-[#8B6F47] px-8 py-3 text-xs font-black whitespace-nowrap text-white uppercase shadow-[0_0_15px_rgba(0,0,0,0.1)] transition-all hover:translate-y-[-2px] hover:bg-[#745B3A]"
								>
									{course.needsRetry ? '再來一局' : '進入考試'}
								</button>
							</div>
						{/each}
					</div>
				{:else if activeTab === 'dashboard'}
					<div class="flex items-center justify-between">
						<h3 class="text-3xl font-black tracking-tighter uppercase" in:fade={{ duration: 300 }}>
							個人學習摘要
						</h3>
					</div>

					<div class="grid grid-cols-1 gap-8 md:grid-cols-2" in:fly={{ y: 20, duration: 400 }}>
						<!-- 今日任務 -->
						<div
							class="space-y-4 rounded-2xl border border-[#4A3000]/5 bg-[#FFF9F0] p-8 shadow-[0_8px_20px_rgba(74,48,0,0.05)]"
						>
							<h4 class="flex items-center gap-2 text-lg font-black tracking-widest uppercase">
								<span class="material-icons text-xl text-[#8B6F47]">auto_awesome</span>
								今日任務
							</h4>
							<div class="flex flex-col gap-3">
								{#each dailyTasks as task}
									<button
										onclick={() => {

											if (task.href) goto(task.href);
											else toggleTask(task.id);
										}}
										class="flex w-full items-center justify-between rounded-xl border-2 p-3 text-left shadow-[0_4px_12px_rgba(74,48,0,0.05)] transition-all active:scale-[0.98]
										{task.completed
											? 'border-[#5F6349]/20 bg-[#5F6349]/10 opacity-60'
											: 'border-transparent bg-[#EADBC8]/60 hover:bg-[#EADBC8]/80'}"
									>
										<div class="flex items-center gap-2">

											<span
												class="text-sm font-black {task.completed
													? 'italic text-[#5F6349] line-through opacity-70'
													: 'text-[#4A3000]'}"
											>
												{task.text}
											</span>
										</div>
										{#if !task.completed && task.href}
											<span class="material-icons text-sm text-[#8B6F47]">arrow_forward</span>
										{/if}
									</button>
								{/each}
							</div>
						</div>

						<!-- 目前學到哪 -->
						<div
							class="md:mt-16 self-start space-y-4 rounded-2xl border border-[#4A3000]/5 bg-[#FFF9F0] p-8 shadow-[0_8px_20px_rgba(74,48,0,0.05)]"
						>
							<h4 class="flex items-center gap-2 text-lg font-black tracking-widest uppercase">
								<span class="material-icons text-xl text-[#8B6F47]">near_me</span>
								目前學到哪
							</h4>
							<p class="text-xl font-black text-[#8B6F47]">
								目前學到：{dashboardProgress.currentChapterLabel}
							</p>
							<p class="text-sm font-bold opacity-60">單元：{dashboardProgress.currentLocation}</p>
							<a
								href={dashboardProgress.continueHref}
								class="mt-2 inline-flex items-center gap-2 text-xs font-black text-[#4A3000] uppercase transition-colors hover:text-[#8B6F47]"
							>
								繼續課程
								<span class="material-icons text-xs">arrow_forward</span>
							</a>
						</div>

						<!-- 學習計時 -->
						<div
							class="space-y-4 rounded-2xl border border-[#4A3000]/5 bg-[#FFF9F0] p-8 shadow-[0_8px_20px_rgba(74,48,0,0.05)]"
						>
							<h4 class="flex items-center gap-2 text-lg font-black tracking-widest uppercase">
								<span class="material-icons text-xl text-[#8B6F47]">timer</span>
								學習計時
							</h4>
							<div class="flex items-end justify-between gap-4">
								<div>
									<p class="text-3xl font-black text-[#8B6F47]">{dashboardStats.totalStudyTime}</p>
									<p class="mt-1 text-sm font-bold opacity-60">累積學習時間</p>
								</div>
								<div class="text-right">
									<p class="text-lg font-black text-[#4A3000]">{dashboardStats.todayStudyTime}</p>
									<p class="text-xs font-black tracking-widest uppercase opacity-40">今日</p>
								</div>
							</div>
						</div>

						<!-- 錯題統計 -->
						<div
							class="space-y-4 rounded-2xl border border-[#4A3000]/5 bg-[#FFF9F0] p-8 shadow-[0_8px_20px_rgba(74,48,0,0.05)]"
						>
							<h4 class="flex items-center gap-2 text-lg font-black tracking-widest uppercase">
								<span class="material-icons text-xl text-[#8B6F47]">error_outline</span>
								錯題複習
							</h4>
							<div class="flex items-end justify-between gap-4">
								<div>
									<p class="text-3xl font-black text-[#8B6F47]">
										{dashboardStats.wrongAnswerCount}題
									</p>
									<p class="mt-1 text-sm font-bold opacity-60">{dashboardStats.wrongAnswerLabel}</p>
								</div>
								<span class="material-icons text-4xl text-[#4A3000]/20">assignment_late</span>
							</div>
						</div>

						<!-- 考試成績 -->
						<div
							class="space-y-6 rounded-2xl border border-[#4A3000]/5 bg-[#FFF9F0] p-8 shadow-[0_8px_20px_rgba(74,48,0,0.05)] md:col-span-2"
						>
							<h4 class="flex items-center gap-2 text-lg font-black tracking-widest uppercase">
								<span class="material-icons text-xl text-[#8B6F47]">grade</span>
								近期考試成績
							</h4>
							<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
								{#each examScores as exam}
									<div
										class="group rounded-xl border-2 border-transparent bg-[#EADBC8]/60 p-4 shadow-[0_4px_12px_rgba(74,48,0,0.05)] transition-all hover:bg-[#EADBC8]/80"
									>
										<div class="mb-2 flex items-start justify-between">
											<span class="text-[10px] font-black tracking-widest uppercase opacity-40"
												>{exam.date}</span
											>
											<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-white/50">
												<span class="material-icons text-sm text-[#4A3000]/40">assignment</span>
											</div>
										</div>
										<h5 class="mb-3 line-clamp-1 text-base font-black text-[#4A3000]">
											{exam.title}
										</h5>
										<div class="flex items-baseline gap-1">
											<span class="text-xl font-black text-[#8B6F47]"
												>{exam.passed ? '通過' : '未通過'}</span
											>
											<span class="text-sm font-black opacity-50">{exam.score}分</span>
										</div>
									</div>
								{/each}
							</div>
						</div>

						<!-- 基本進度顯示 -->
						<div
							class="space-y-6 rounded-2xl bg-[#9E825F] p-8 shadow-[0_8px_20px_rgba(0,0,0,0.15)] md:col-span-2"
						>
							<div class="flex items-center justify-between text-[#EADBC8]">
								<h4 class="flex items-center gap-2 text-lg font-black tracking-widest uppercase">
									<span class="material-icons text-xl opacity-80">trending_up</span>
									基本進度顯示
								</h4>
								<span
									class="rounded-full bg-[#EADBC8] px-3 py-1 text-xs font-black tracking-widest text-[#4A3000] uppercase"
									>{dashboardProgress.overallStatus}</span
								>
							</div>

							<div class="grid grid-cols-1 gap-8 md:grid-cols-3">
								{#each displayedCourses as course}
									<div class="space-y-3">
										<div class="flex justify-between text-[#EADBC8]">
											<span class="text-sm font-black tracking-tight uppercase">{course.title}</span
											>
											<span class="text-xs font-black">{course.progress}%</span>
										</div>
										<div class="h-2 w-full overflow-hidden rounded-full bg-[#EADBC8]/20">
											<div
												class="h-full bg-[#EADBC8] transition-all duration-1000"
												style="width: {course.progress}%"
											></div>
										</div>
									</div>
								{/each}
							</div>
						</div>
					</div>
				{:else if activeTab === 'settings'}
					<div
						class="flex min-h-[400px] items-center justify-center rounded-3xl border-2 border-dashed border-[#4A3000]/10"
						in:fade={{ duration: 300 }}
					>
						<p class="text-sm font-black tracking-widest uppercase italic opacity-20">
							設定專區開發中...
						</p>
					</div>
				{:else}
					<!-- 理化課程 (原始設計) -->
					<div class="flex items-center justify-between">
						<h3 class="text-3xl font-black tracking-tighter uppercase" in:fade={{ duration: 300 }}>
							當前課程進度
						</h3>
					</div>

					<div class="grid grid-cols-1 gap-6" in:fly={{ y: 20, duration: 400 }}>
						{#each displayedCourses as course}
							<div
								class="group flex flex-col items-center gap-8 rounded-2xl bg-[#FFF9F0] p-6 shadow-[0_8px_20px_rgba(74,48,0,0.05)] transition-all hover:translate-y-[-2px] hover:shadow-[0_12px_25px_rgba(74,48,0,0.08)] md:flex-row"
							>
								<div
									class="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-[#EADBC8]"
								>
									{#if course.icon === 'volume_measurement'}
										<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" viewBox="0 0 24 24" fill="currentColor">
											<path d="M5 21h14v2H5z" />
											<path fill-rule="evenodd" d="M8 2h8v19H8V2zm1.5 1.5h5V19h-5V3.5z" clip-rule="evenodd" />
											<rect x="9.5" y="10" width="5" height="9" />
											<rect x="9.5" y="5" width="2" height="1" />
											<rect x="9.5" y="7.5" width="1.5" height="1" />
											<rect x="9.5" y="10" width="2" height="1" />
											<rect x="9.5" y="12.5" width="1.5" height="1" />
											<rect x="9.5" y="15" width="2" height="1" />
										</svg>
									{:else}
										<span class="material-icons text-3xl">{course.icon}</span>
									{/if}
								</div>
								<div class="w-full flex-grow space-y-2">
									<div class="flex items-end justify-between">
										<h4 class="text-xl font-black uppercase">{course.title}</h4>
										<span class="text-xs font-black italic opacity-40"
											>學習時長：{course.lastStudy}</span
										>
									</div>
									<!-- 圓弧進度條 (加粗) -->
									<div
										class="relative h-5 w-full overflow-hidden rounded-full bg-[#EADBC8] shadow-[0_0_10px_rgba(0,0,0,0.05)]"
									>
										<div
											class="h-full rounded-full bg-[#8B6F47] transition-all duration-1000"
											style="width: {course.progress}%"
										>
											<!-- 進度條內部斜紋 -->
											<div
												class="absolute inset-0 opacity-20"
												style="background-image: linear-gradient(45deg, #FFF 25%, transparent 25%, transparent 50%, #FFF 50%, #FFF 75%, transparent 75%, transparent); background-size: 10px 10px;"
											></div>
										</div>
										<span
											class="absolute top-1/2 right-4 -translate-y-1/2 text-xs font-black text-[#4A3000] drop-shadow-sm"
											>{course.progress}%</span
										>
									</div>
								</div>
								<a
									href={course.href ?? '/1-1'}
									class="rounded-xl bg-[#8B6F47] px-8 py-3 text-xs font-black whitespace-nowrap text-white uppercase shadow-[0_0_15px_rgba(0,0,0,0.1)] transition-all hover:translate-y-[-2px] hover:bg-[#745B3A]"
								>
									繼續學習
								</a>
							</div>
						{/each}
					</div>
				{/if}
			</section>
		</main>
	</div>
</div>

<style>
	:global(body) {
		margin: 0;
		background-color: #eadbc8;
	}

	/* 增加像素顆粒感 */
	.min-h-screen::before {
		content: '';
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
		background-image: url('https://www.transparenttextures.com/patterns/p6.png');
		opacity: 0.1;
		z-index: 100;
	}

	/* 自定義像素字體或排版 */
	:global(h1),
	:global(h2),
	:global(h3),
	:global(h4),
	button,
	a {
		letter-spacing: 0;
	}
</style>
