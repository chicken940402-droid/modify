<script lang="ts">
	import type { CourseState } from '$lib/course/courseState.svelte';
	import { fade } from 'svelte/transition';

	let { courseState }: { courseState: CourseState } = $props();

	function toggleSidebar() {
		courseState.isSidebarOpen = !courseState.isSidebarOpen;
	}

	function closeSidebar() {
		courseState.isSidebarOpen = false;
	}
</script>

<!-- 背景遮罩 -->
{#if courseState.isSidebarOpen}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		transition:fade={{ duration: 200 }}
		class="fixed inset-0 z-40 cursor-zoom-out bg-black/10 backdrop-blur-[1px]"
		onclick={closeSidebar}
	></div>
{/if}

<!-- 側邊標籤按鈕（位置與側邊欄連動） -->
<button
	class="pixel-button fixed top-1/2 z-[60] !m-0 flex w-fit -translate-y-1/2 cursor-pointer flex-col items-center gap-1.5 bg-[var(--bg-main)] px-[10px] py-[16px] text-[#4b3324] shadow-[0_-3px_0_0_#4b3324,0_3px_0_0_#4b3324,-3px_0_0_0_#4b3324,3px_0_0_0_#4b3324,0_-6px_0_0_#d4a745,0_6px_0_0_#d4a745,-6px_0_0_0_#d4a745,6px_0_0_0_#d4a745,0_-9px_0_0_#4b3324,0_9px_0_0_#4b3324,-9px_0_0_0_#4b3324,9px_0_0_0_#4b3324] transition-all duration-400 select-none hover:brightness-[1.02] active:translate-y-[calc(-50%+2px)]"
	style="right: {courseState.isSidebarOpen ? '40vw' : '0'}"
	onclick={toggleSidebar}
>
	<!-- 連接四角的內框線 -->
	<div class="inner-frame"></div>

	<!-- 四角正方形像素裝飾 (3x3 像素) -->
	<div class="corner-ornament top-left"></div>
	<div class="corner-ornament top-right"></div>
	<div class="corner-ornament bottom-left"></div>
	<div class="corner-ornament bottom-right"></div>

	<span
		class="relative z-10 text-lg leading-none font-black tracking-[0.2em] uppercase select-none [writing-mode:vertical-lr]"
	>
		{courseState.isSidebarOpen ? '關閉課文' : '查看課文'}
	</span>
	<svg
		xmlns="http://www.w3.org/2000/svg"
		class="relative z-10 h-6 w-6 transform transition-transform duration-500"
		class:rotate-180={courseState.isSidebarOpen}
		fill="none"
		viewBox="0 0 24 24"
		stroke="currentColor"
	>
		<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M15 19l-7-7 7-7" />
	</svg>
</button>

<!-- 抽屜主體 -->
<aside class="drawer-container" class:is-open={courseState.isSidebarOpen}>
	<div class="custom-scrollbar h-full overflow-y-auto p-8">
		<ul class="space-y-4">
			{#each courseState.lessons as lesson}
				<li class="group flex items-start gap-4 rounded-xl p-2 transition-all hover:bg-blue-50/50">
					<div
						class="mt-3.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500 opacity-40 transition-opacity group-hover:opacity-100"
					></div>
					<div class="flex-1">
						<h4
							class="mb-1 leading-tight font-bold text-gray-900 transition-colors group-hover:text-blue-600"
						>
							{lesson.fullId}
						</h4>
						<p class="line-clamp-2 text-sm leading-relaxed text-gray-500">
							{lesson.contentText}
						</p>
					</div>
				</li>
			{/each}
		</ul>
	</div>
</aside>

<style>
	.pixel-button {
		image-rendering: pixelated;
	}

	/* 連接線 (Inner Frame Lines) */
	.inner-frame {
		position: absolute;
		top: 3px;
		left: 3px;
		right: 3px;
		bottom: 3px;
		border: 1.5px solid #4b3324;
		border-top-color: #f1c27d;
		border-left-color: #f1c27d;
		border-right-color: #8b5e3c;
		border-bottom-color: #8b5e3c;
		box-shadow: 2px 2px 0 0 rgba(0, 0, 0, 0.2);
		pointer-events: none;
	}

	/* 角落裝飾 (Corner Ornaments) - 3x3 正方形 */
	.corner-ornament {
		position: absolute;
		width: 3px;
		height: 3px;
		background-color: #4b3324;
		pointer-events: none;
		box-shadow: inset -1px -1px 0 0 #d4a745;
	}

	.top-left {
		top: 2px;
		left: 2px;
	}
	.top-right {
		top: 2px;
		right: 2px;
	}
	.bottom-left {
		bottom: 2px;
		left: 2px;
	}
	.bottom-right {
		bottom: 2px;
		right: 2px;
	}

	/* 按壓時的裝飾位移 */
	.pixel-button:active .corner-ornament,
	.pixel-button:active .inner-frame {
		transform: translateY(-0.5px);
	}

	/* 抽屜：固定在右側，透過 right 值控制滑入滑出 */
	.drawer-container {
		position: fixed;
		top: 0;
		right: -40vw; /* 預設隱藏在右邊外面 */
		width: 40vw;
		height: 100vh;
		background-color: white;
		border-left: 2px solid black;
		box-shadow: -10px 0 30px rgba(0, 0, 0, 0.1);
		z-index: 55; /* 高於按鈕的 z-50 */
		transition: right 0.4s ease-in-out;
	}

	.drawer-container.is-open {
		right: 0; /* 滑入畫面 */
	}

	.custom-scrollbar::-webkit-scrollbar {
		width: 6px;
	}
	.custom-scrollbar::-webkit-scrollbar-track {
		background: transparent;
	}
	.custom-scrollbar::-webkit-scrollbar-thumb {
		background: #e2e8f0;
		border-radius: 10px;
	}
	.custom-scrollbar::-webkit-scrollbar-thumb:hover {
		background: #cbd5e1;
	}
</style>
