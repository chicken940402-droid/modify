<script lang="ts">
	let {
		type,
		config,
		sliderX,
		startDragX,
		pullHistory = [],
		activePullIndex = 0,
		onStaticClick
	}: {
		type: string;
		config: any;
		sliderX: number;
		startDragX: number;
		pullHistory?: { startMm: number; currentMm: number }[];
		activePullIndex?: number;
		onStaticClick: () => void;
	} = $props();

	const pxPerCm = 40;
	const pxPerMm = 4;
	const offsetX = 50;
	const colors = ['#3b82f6', '#10b981', '#fbbf24', '#f97316', '#ef4444'];

	function handleStaticKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			onStaticClick();
		}
	}
</script>

<!-- A1 點擊 -->
{#if type === 'STATIC'}
	<!-- 將點擊位置移至 19.5cm 的 cm 字樣處 -->
	<g
		role="button"
		tabindex="0"
		onclick={onStaticClick}
		onkeydown={handleStaticKeydown}
		class="group cursor-pointer"
	>
		<rect
			x={offsetX + 19.5 * pxPerCm - 25}
			y={65 - 25}
			width="50"
			height="50"
			fill="#DABEA7"
			fill-opacity="0.3"
			class="group-hover:fill-opacity-100 transition-all"
		/>
		<rect
			x={offsetX + 19.5 * pxPerCm - 18}
			y={65 - 18}
			width="36"
			height="36"
			stroke="#ef4444"
			stroke-width="2"
			fill="none"
			stroke-dasharray="4 4"
		/>
		<text
			x={offsetX + 19.5 * pxPerCm}
			y="30"
			text-anchor="middle"
			font-family="'Courier New', Courier, monospace"
			font-size="14"
			font-weight="900"
			fill="#ef4444"
			class="animate-bounce">CLICK!</text
		>
	</g>
{/if}

<!-- 拖曳視覺指示 -->
{#if type && (type.includes('DRAG') || type === 'PRECISION')}
	<!-- 1. 渲染歷史路徑 -->
	{#each pullHistory as pull, i}
		{@const y = 150 + i * 30}
		{@const color = colors[i % colors.length]}
		{@const hStartX = offsetX + pull.startMm * pxPerMm}
		{@const hEndX = offsetX + pull.currentMm * pxPerMm}

		<g opacity="0.8">
			<line
				x1={hStartX}
				y1={y}
				x2={hEndX}
				y2={y}
				stroke={color}
				stroke-width="6"
				stroke-linecap="butt"
				stroke-dasharray="2 2"
			/>
			<rect x={hStartX - 3} y={y - 3} width="6" height="6" fill={color} />
			<rect x={hEndX - 3} y={y - 3} width="6" height="6" fill={color} />
			<g transform="translate({hEndX}, {y}) rotate(-15) scale(0.6)">
				<!-- 筆尖 -->
				<path d="M -4 -10 L 0 0 L 4 -10 Z" fill="#2d3436" />
				<!-- 筆尖連接處 -->
				<rect x="-4" y="-14" width="8" height="4" fill="#EADBC8" />
				<!-- 筆身 -->
				<rect x="-4" y="-54" width="8" height="40" fill={color} stroke="#000" stroke-width="2" />
				<!-- 橡皮擦 -->
				<rect x="-4" y="-62" width="8" height="8" fill="#ff7675" stroke="#000" stroke-width="2" />
			</g>
		</g>
	{/each}

	<!-- 2. 渲染當前活躍路徑 -->
	{#if !config?.pulls || activePullIndex < config.pulls}
		{@const currentY = 150 + activePullIndex * 30}
		{@const currentColor = colors[activePullIndex % colors.length] || '#3b82f6'}
		{@const range = config?.range ?? [0, 20]}
		{@const startX = range[0] * pxPerCm + offsetX}
		{@const endX = range[1] * pxPerCm + offsetX}

		<rect
			x={startX}
			y={currentY - 6}
			width={endX - startX}
			height="12"
			fill="#f3f4f6"
			rx="0"
		/>
		<line
			x1={startDragX}
			y1={currentY}
			x2={sliderX}
			y2={currentY}
			stroke={currentColor}
			stroke-width="6"
			stroke-linecap="butt"
			stroke-dasharray="2 2"
		/>

		<g transform="translate({sliderX}, {currentY})" class="pointer-events-none">
			<g transform="rotate(-15)">
				<!-- 筆尖 -->
				<path d="M -4 -10 L 0 0 L 4 -10 Z" fill="#2d3436" />
				<!-- 筆尖連接處 (木質色) -->
				<rect x="-4" y="-14" width="8" height="4" fill="#EADBC8" />
				<!-- 筆身 -->
				<rect x="-4" y="-54" width="8" height="40" fill={currentColor} stroke="#000" stroke-width="2" />
				<!-- 橡皮擦 -->
				<rect x="-4" y="-62" width="8" height="8" fill="#ff7675" stroke="#000" stroke-width="2" />
			</g>
			<rect x="-3" y="-3" width="6" height="6" fill="#1f2937" />
		</g>

		<rect x={startX - 4} y={currentY - 4} width="8" height="8" fill="#9ca3af" />
		<rect x={endX - 4} y={currentY - 4} width="8" height="8" fill="#9ca3af" />
	{/if}
{/if}
