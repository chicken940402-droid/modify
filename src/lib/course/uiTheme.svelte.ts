export class UITheme {
	current = $state<'pixel' | 'classic'>('classic');

	toggle() {
		this.current = this.current === 'pixel' ? 'classic' : 'pixel';
	}

	get styles() {
		if (this.current === 'pixel') {
			return {
				container:
					'bg-[#876D5A] border-none shadow-[0_-4px_0_0_#211a14,0_4px_0_0_#211a14,-4px_0_0_0_#211a14,4px_0_0_0_#211a14,inset_4px_4px_0_0_#b5ad9b,inset_-4px_-4px_0_0_#4a3b2b] rounded-none p-8 relative overflow-hidden',
				quiz: 'bg-[#876D5A] border-[2px] border-[#211a14] shadow-[4px_4px_0_0_rgba(0,0,0,0.15)] rounded-none',
				board:
					'bg-[#efede8] border-[3px] border-[#211a14] shadow-[0_0_0_2px_#f0c05a,inset_4px_4px_0_0_#ffffff,inset_-4px_-4px_0_0_#b5ad9b] rounded-none p-12',
				button:
					'bg-[#e5e0d4] text-[#2d2d2d] border-none shadow-[0_-2px_0_0_#4a3b2b,0_2px_0_0_#4a3b2b,-2px_0_0_0_#4a3b2b,2px_0_0_0_#4a3b2b,0_-4px_0_0_#000,0_4px_0_0_#000,-4px_0_0_0_#000,4px_0_0_0_#000,0_8px_0_0_rgba(0,0,0,0.1)] hover:brightness-105 active:translate-y-[2px] transition-all rounded-none',
				input:
					'bg-white border-[2px] border-[#211a14] text-black focus:bg-white outline-none rounded-none placeholder:text-gray-400',
				text: 'text-[#3d2a1a] font-black tracking-tight font-sans',
				pill: 'border-[1.3px] border-black bg-[#DABEA7] px-2 py-0.5 rounded-none text-white font-medium text-[13px] [text-shadow:_1px_1px_0_#000,_-1px_-1px_0_#000,_1px_-1px_0_#000,_-1px_1px_0_#000] shadow-[inset_1px_1px_0_0_#ffffff,inset_-1px_-1px_0_0_#e8e2d4]'
			};
		}

		// classic 模式 (還原至原始設計)
		return {
			container:
				'bg-[#EADBC8] border-none shadow-[0_-4px_0_0_#4A3000,0_4px_0_0_#4A3000,-4px_0_0_0_#4A3000,4px_0_0_0_#4A3000,inset_4px_4px_0_0_#FFF9F0,inset_-4px_-4px_0_0_#8B6F47] rounded-none p-8',
			quiz: 'bg-[#EADBC8] shadow-[0_10px_50px_rgba(0,0,0,0.25)] rounded-none',
			board: '',
			button: 'btn-classic-frame',
			input:
				'bg-white border-2 border-gray-200 text-black focus:border-[#D4A017] focus:ring-0 outline-none rounded-2xl placeholder:text-gray-300',
			text: 'text-[#4A3000] font-black tracking-tight font-sans',
			pill: 'font-black text-xs tracking-[0.2em] uppercase px-3 py-1 transition-all bg-[#8B6F47] text-[#EADBC8] font-bold text-[13px] px-4 py-1 rounded-full'
		};
	}
}

export const uiTheme = new UITheme();
