<script lang="ts">
	import type { CourseState } from '../../../courseState.svelte';
	import RulerBase from './RulerBase.svelte';
	import RulerInteraction from './RulerInteraction.svelte';

	import PixelButton from '../../PixelButton.svelte';

	import { uiTheme } from '../../../uiTheme.svelte';

	let {
		courseState,
		currentDistance = $bindable(0),
		accumulatedPulls = $bindable(0),
		isActionCorrect = $bindable(false),
		resetTrigger = 0,
		onCorrect
	}: {
		courseState: CourseState;
		currentDistance: number;
		accumulatedPulls: number;
		isActionCorrect: boolean;
		resetTrigger?: number;
		onCorrect: () => void;
	} = $props();

	let currentStage = $derived(courseState.currentStage);
	let config = $derived(currentStage.simulator?.config);
	let styles = $derived(uiTheme.styles);

	const pxPerMm = 4;
	const pxPerCm = 40;
	const svgWidth = 900;
	const svgHeight = 320;
	const offsetX = 50;

	let isDragging = $state(false);
	let currentMm = $state(0);
	let startMm = $state(0);
	let pullHistory = $state<{ startMm: number; currentMm: number }[]>([]);

	let sliderX = $derived(offsetX + currentMm * pxPerMm);
	let startDragX = $derived(offsetX + startMm * pxPerMm);

	$effect(() => {
		currentDistance = Math.abs(currentMm - startMm) / 10;
		if (
			currentStage.simulator?.id === 'RULER_DRAG' ||
			currentStage.simulator?.id === 'RULER_DRAG_PRECISION'
		) {
			const target = config?.target ?? 0;
			isActionCorrect = Math.abs(currentDistance - target) <= 0.051;
		}
	});

	$effect(() => {
		if (currentStage) reset(true);
	});

	// 監控外部重置訊號
	$effect(() => {
		if (resetTrigger > 0) reset(true);
	});

	function reset(isFullReset = false) {
		const id = currentStage.simulator?.id;
		if (isFullReset) {
			pullHistory = [];
			accumulatedPulls = 0;
		}
		if (id === 'RULER_STATIC' || id === 'RULER_DRAG_ACCUMULATE') {
			startMm = 0;
			currentMm = 0;
		} else {
			startMm = 50;
			currentMm = 50;
		}
		currentDistance = 0;
		isActionCorrect = false;
	}

	function handleInput(clientX: number, target: SVGElement) {
		const svgRect = target.getBoundingClientRect();
		const x = ((clientX - svgRect.left) * svgWidth) / svgRect.width;
		let xMm = Math.round((x - offsetX) / pxPerMm);
		xMm = Math.max(0, Math.min(200, xMm));
		if (!isDragging) startMm = xMm;
		currentMm = xMm;

		if (currentStage.simulator?.id === 'RULER_DRAG_ACCUMULATE' && isDragging) {
			const targetDist = config?.target ?? 20;
			if (currentDistance >= targetDist) completeCurrentPull();
		}
	}

	function completeCurrentPull() {
		isDragging = false;
		pullHistory.push({ startMm, currentMm });
		accumulatedPulls++;
		if (accumulatedPulls >= (config?.pulls ?? 5)) {
			isActionCorrect = true;
			onCorrect();
		} else {
			reset(false);
		}
	}

	function onPointerDown(e: MouseEvent | TouchEvent) {
		if (currentStage.simulator?.id === 'RULER_STATIC' || courseState.isUnlocked(currentStage.id))
			return;
		if (e.type === 'touchstart') e.preventDefault();
		isDragging = true;
		const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
		handleInput(clientX, e.currentTarget as SVGElement);
	}

	function onPointerMove(e: MouseEvent | TouchEvent) {
		if (!isDragging || currentStage.simulator?.id === 'RULER_STATIC') return;
		if (e.type === 'touchmove') e.preventDefault();
		const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
		handleInput(clientX, e.currentTarget as SVGElement);
	}

	function handleStaticClick() {
		if (currentStage.simulator?.id === 'RULER_STATIC') {
			isActionCorrect = true;
			onCorrect();
		}
	}
</script>

<div class="relative flex flex-col overflow-hidden">
	<div class="pointer-events-none absolute top-4 right-4 z-10 flex flex-col gap-4">
		{#if currentStage.simulator?.id.includes('DRAG')}
			<div
				class="flex items-center gap-4 bg-blue-600 px-4 py-2 text-white shadow-[0_-2.5px_0_0_#000,0_2.5px_0_0_#000,-2.5px_0_0_0_#000,2.5px_0_0_0_#000]"
			>
				<span class="text-[10px] font-black tracking-widest opacity-80">DISTANCE</span>
				<span class="font-mono text-xl font-black"
					>{currentDistance.toFixed(1)} <small class="text-xs">cm</small></span
				>
			</div>
			{#if currentStage.simulator?.id.includes('ACCUMULATE')}
				<div
					class="flex items-center gap-4 bg-emerald-600 px-4 py-2 text-white shadow-[0_-2.5px_0_0_#000,0_2.5px_0_0_#000,-2.5px_0_0_0_#000,2.5px_0_0_0_#000]"
				>
					<span class="text-[10px] font-black tracking-widest opacity-80">PROGRESS</span>
					<span class="font-mono text-xl font-black">{accumulatedPulls} / {config?.pulls ?? 0}</span
					>
				</div>
			{/if}
		{/if}
	</div>

	<!-- svelte-ignore a11y_no_noninteractive_element_interactions, a11y_no_noninteractive_tabindex -->
	<svg
		width="100%"
		viewBox="0 0 {svgWidth} {svgHeight}"
		preserveAspectRatio="xMidYMid meet"
		onmousedown={onPointerDown}
		onmousemove={onPointerMove}
		onmouseup={() => (isDragging = false)}
		onmouseleave={() => (isDragging = false)}
		ontouchstart={onPointerDown}
		ontouchmove={onPointerMove}
		ontouchend={() => (isDragging = false)}
		class="cursor-pointer select-none"
		class:pointer-events-none={courseState.isUnlocked(currentStage.id) &&
			currentStage.simulator?.id !== 'RULER_STATIC'}
		role="application"
		tabindex="0"
		aria-label="互動式尺規"
	>
		<RulerBase {startMm} {currentMm} />
		<RulerInteraction
			type={currentStage.simulator?.config.type}
			config={currentStage.simulator?.config}
			{sliderX}
			{startDragX}
			{pullHistory}
			activePullIndex={accumulatedPulls}
			onStaticClick={handleStaticClick}
		/>
	</svg>

	<!-- 按鈕已從此處移除，將搬移至上一層組件 -->
</div>

<style>
	.pointer-events-none {
		pointer-events: none;
	}
</style>
