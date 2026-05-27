import type { CourseData } from '$lib/course/types';

export const courseData1_2: CourseData = {
	chapter: '1-1.2',
	section: '2',
	title: '測量結果的表示',
	lessons: [
		{
			id: 'B1',
			fullId: '1-1.2 B1',
			type: '觀念',
			question: '測量結果包含哪些部分？',
			simulator: {
				id: 'QUIZ_UNIT',
				config: { id: 'QUIZ_UNIT' }
			},
			simContent: `
<div class="flex flex-col items-center gap-8 py-8 w-full max-w-2xl mx-auto">
	<div class="flex items-center justify-center gap-4 text-2xl font-bold text-slate-700 w-full">
		<div class="flex-1 text-center py-4 bg-white border-2 border-slate-200 rounded-xl shadow-sm">數值</div>
		<div class="text-slate-400 font-black">+</div>
		<div class="flex-1 text-center py-4 bg-white border-2 border-slate-200 rounded-xl shadow-sm">單位</div>
	</div>

	<div class="w-full h-px bg-slate-200 relative">
		<div class="absolute -top-3 left-1/4 -translate-x-1/2 bg-slate-50 px-2 text-sm text-slate-400">數值包含</div>
	</div>

	<div class="flex items-center justify-start gap-4 text-xl font-bold text-slate-700 w-full pl-8">
		<div class="w-1/3 text-center py-3 bg-blue-50 border-2 border-blue-200 text-blue-700 rounded-xl shadow-sm">準確值</div>
		<div class="text-slate-400 font-black">+</div>
		<div class="w-1/3 text-center py-3 bg-emerald-50 border-2 border-emerald-200 text-emerald-700 rounded-xl shadow-sm">估計值</div>
	</div>
	
	<div class="w-full text-left space-y-3 mt-4 text-slate-600 px-8">
		<p class="flex items-baseline gap-2"><span class="font-black text-blue-600 whitespace-nowrap">準確值 =</span> 測量工具的最小單位，數值必正確。</p>
		<p class="flex items-baseline gap-2"><span class="font-black text-emerald-600 whitespace-nowrap">估計值 =</span> 比最小單位再更小的數值，憑肉眼可能有誤差。</p>
	</div>
</div>
			`,
			contentText: '1 準確值 + 估計值 = 數值'
		},
		{
			id: 'B2',
			fullId: '1-1.2 B2',
			type: '邏輯',
			question: '測量的結果為：',
			simulator: {
				id: 'QUIZ_UNIT',
				config: { id: 'QUIZ_UNIT' }
			},
			simContent: `
<div class="flex flex-col items-center justify-center py-8 w-full max-w-2xl mx-auto">
	<div class="w-full mb-8 text-left">
		<span class="text-xl font-bold text-slate-700">測量的結果為：</span>
	</div>
	<div class="grid grid-cols-[100px_40px_100px_80px_40px_120px_60px] gap-y-2 items-end justify-center text-xl font-mono text-slate-700 w-full">
		
		<!-- 數值列 (上層) -->
		<div class="text-center text-rose-500 font-black border-b-2 border-slate-700 pb-1">10.7</div>
		<div class="text-center text-slate-700 font-bold pb-1">+</div>
		<div class="text-center text-rose-500 font-black border-b-2 border-slate-700 pb-1">0.08</div>
		<div class="text-center text-slate-700 font-bold pb-1">+ cm</div>
		<div class="text-center text-slate-700 font-bold pb-1">=</div>
		<div class="text-center text-rose-500 font-black border-b-2 border-slate-700 pb-1">10.78</div>
		<div class="text-left text-slate-700 font-bold pb-1 pl-2">cm</div>

		<!-- 文字列 (下層) -->
		<div class="text-center text-base font-bold text-slate-700 pt-1">準確值</div>
		<div class="text-center text-slate-700 font-bold pt-1">+</div>
		<div class="text-center text-base font-bold text-slate-700 pt-1">估計值</div>
		<div class="text-center text-base font-bold text-slate-700 pt-1">+ 單位</div>
		<div class="text-center text-slate-700 font-bold pt-1">=</div>
		<div class="text-center text-base font-bold text-slate-700 pt-1">測量結果</div>
		<div></div>
	</div>
</div>
			`,
			contentText: '1 10.7 + 0.08 = 10.78'
		},
		{
			id: 'B3',
			fullId: '1-1.2 B3',
			type: '體感',
			question: '測量結果的判斷',
			simulator: {
				id: 'RULER_STATIC',
				config: { id: 'RULER_STATIC', type: 'STATIC' }
			},
			simContent: `
<div class="w-full flex justify-center py-6">
	<div class="relative inline-block">
		<img src="/src/routes/1-1/1-1.2.png" alt="測量結果的判斷" class="max-w-full rounded-xl shadow-md border border-slate-200" />
		<!-- 這個區塊可未來用真實的 RulerBase SVG 取代，目前先使用原圖 -->
	</div>
</div>
			`,
			contentText: '1 測量的結果 = 10.78 cm'
		}
	]
};
