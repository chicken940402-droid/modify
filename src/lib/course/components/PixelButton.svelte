<script lang="ts">
	import { uiTheme } from '../uiTheme.svelte';

	let {
		children,
		onclick,
		size = 'md',
		color = 'default',
		title = '',
		...rest
	}: {
		children?: any;
		onclick?: () => void;
		size?: 'xs' | 'sm' | 'md' | 'lg';
		color?: 'default' | 'red' | 'emerald' | 'blue';
		title?: string;
		[key: string]: any;
	} = $props();

	let styles = $derived(uiTheme.styles);

	const colorClasses = {
		default: 'bg-[var(--bg-main)] text-[#4b3324]',
		red: 'bg-[#ff6b6b] text-[#4b3324]',
		emerald: 'bg-[#2ecc71] text-[#4b3324]',
		blue: 'bg-[#3498db] text-[#4b3324]'
	};

	// 等比例縮小的尺寸設定
	const sizeClasses = {
		xs: '!px-4 !py-1.5 !text-[10px]',
		sm: '!px-6 !py-2 !text-[11px]',
		md: '!px-12 !py-3 !text-xs',
		lg: '!px-16 !py-4 !text-sm'
	};

	let buttonClass = $derived(`
		pixel-button relative inline-flex items-center justify-center font-black tracking-[0.1em] uppercase transition-all active:translate-y-[2px] 
		${sizeClasses[size]} 
		${colorClasses[color as keyof typeof colorClasses] || colorClasses.default}
		cursor-pointer select-none hover:brightness-[1.02]
	`);
</script>

<button class={buttonClass} {onclick} {title} {...rest}>
	<!-- 內部立體框線 -->
	<div class="inner-frame"></div>

	<!-- 四角正方形像素裝飾 (配合小按鈕尺寸) -->
	<div class="corner-ornament top-left"></div>
	<div class="corner-ornament top-right"></div>
	<div class="corner-ornament bottom-left"></div>
	<div class="corner-ornament bottom-right"></div>

	<span class="relative z-10 flex items-center gap-1.5 leading-none">
		{@render children?.()}
	</span>
</button>

<style>
	.pixel-button {
		image-rendering: pixelated;
		border: none !important;
		border-radius: 0 !important;
		/* 32-bit Pixel Art 空角外框：棕(2px) -> 黃(4px) -> 棕(6px) */
		box-shadow: 
			/* 第一層：深褐色內層 */
			0 -2px 0 0 #4b3324,
			0 2px 0 0 #4b3324,
			-2px 0 0 0 #4b3324,
			2px 0 0 0 #4b3324,
			/* 第二層：黃色中層 */ 0 -4px 0 0 #d4a745,
			0 4px 0 0 #d4a745,
			-4px 0 0 0 #d4a745,
			4px 0 0 0 #d4a745,
			/* 第三層：深褐色外層 */ 0 -6px 0 0 #4b3324,
			0 6px 0 0 #4b3324,
			-6px 0 0 0 #4b3324,
			6px 0 0 0 #4b3324 !important;
	}

	/* 連接線 (Inner Frame Lines) */
	.inner-frame {
		position: absolute;
		top: 2px;
		left: 2px;
		right: 2px;
		bottom: 2px;
		border: 1.5px solid #4b3324;
		border-top-color: #f1c27d;
		border-left-color: #f1c27d;
		border-right-color: #8b5e3c;
		border-bottom-color: #8b5e3c;
		box-shadow: 2px 2px 0 0 rgba(0, 0, 0, 0.2);
		pointer-events: none;
	}

	/* 角落裝飾 (Corner Ornaments) */
	.corner-ornament {
		position: absolute;
		width: 3px;
		height: 3px;
		background-color: #4b3324;
		pointer-events: none;
		box-shadow: inset -1px -1px 0 0 #d4a745;
	}

	.top-left {
		top: 1px;
		left: 1px;
	}
	.top-right {
		top: 1px;
		right: 1px;
	}
	.bottom-left {
		bottom: 1px;
		left: 1px;
	}
	.bottom-right {
		bottom: 1px;
		right: 1px;
	}

	.pixel-button:active .corner-ornament,
	.pixel-button:active .inner-frame {
		transform: translateY(-0.5px);
	}
</style>
