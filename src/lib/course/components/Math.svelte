<script lang="ts">
	import katex from 'katex';
	import { uiTheme } from '../uiTheme.svelte';

	let { formula = '', displayMode = true } = $props();

	// 確保 KaTeX 在渲染時不會因為語法錯誤崩潰，並根據主題自動選擇字體渲染方式
	let html = $derived.by(() => {
		try {
			return katex.renderToString(formula, {
				displayMode,
				throwOnError: false,
				strict: false
			});
		} catch (e) {
			console.error('KaTeX error:', e);
			return formula; // 降級回傳原始字串
		}
	});

	let isPixel = $derived(uiTheme.current === 'pixel');
</script>

<div class="math-renderer {isPixel ? 'pixel-mode' : 'classic-mode'}" class:font-mono={isPixel}>
	{@html html}
</div>

<style>
	.math-renderer {
		display: inline-block;
		width: 100%;
		transition: all 0.3s ease;
	}

	:global(.katex) {
		font-size: 1.1em;
	}

	/* 經典模式：極致優雅 */
	.classic-mode :global(.katex) {
		color: inherit;
	}

	/* 像素模式：強化邊緣感，消解平滑度 */
	.pixel-mode :global(.katex) {
		color: #000;
	}
</style>
