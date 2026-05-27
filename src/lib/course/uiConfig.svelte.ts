export type UITheme = 'classic' | 'pixel';

class UIConfig {
	theme = $state<UITheme>('classic');

	// 根據主題切換樣式字串
	get styles() {
		if (this.theme === 'pixel') {
			return {
				// 核心容器：粗黑邊、硬影子、無圓角
				container: 'bg-[#f8f8f8] border-[4px] border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)]',
				// 問答框：淡黃色背景、像素陰影
				quiz: 'bg-[#ffffd8] border-[4px] border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)]',
				// 推導板：深灰色粗邊
				board: 'bg-[#e0e0e0] border-[4px] border-black shadow-[6px_6px_0_0_rgba(0,0,0,1)]',
				// 按鈕：像素感小影子
				button:
					'bg-white border-[2px] border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all',
				// 文字顏色
				text: 'text-black font-mono',
				rounded: 'rounded-none',
				pill: 'border-[2px] border-black px-2 py-0.5'
			};
		}

		// 預設的 Classic (實驗室) 風格
		return {
			container: 'bg-white border-gray-100 shadow-sm',
			quiz: 'bg-white/90 backdrop-blur-md border-blue-200 shadow-xl',
			board: '',
			button: 'bg-gray-100 hover:bg-gray-200 text-gray-500 border-gray-200 shadow-sm',
			text: 'text-gray-700 font-sans',
			rounded: 'rounded-2xl',
			pill: 'bg-blue-50 text-blue-600 border-blue-100 rounded-full'
		};
	}

	toggle() {
		this.theme = this.theme === 'classic' ? 'pixel' : 'classic';
	}
}

export const uiConfig = new UIConfig();
