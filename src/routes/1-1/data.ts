import type { CourseData } from '$lib/course/types';

export const courseData: CourseData = {
	chapter: '1-1',
	section: '1',
	title: '長度與體積的測量',
	lessons: [
		{
			id: 'A1',
			fullId: '1-1.1 A1',
			type: '體感',
			question: '觀察直尺，一公分的英文單位在哪裡？(點擊位置)',
			simulator: {
				id: 'RULER_STATIC',
				config: { id: 'RULER_STATIC', type: 'STATIC' }
			},
			contentText: '1公分 = 1cm'
		},
		{
			id: 'A2',
			fullId: '1-1.1 A2',
			type: '體感',
			question: '描繪10cm',
			simulator: {
				id: 'RULER_DRAG',
				config: { id: 'RULER_DRAG', type: 'DRAG', target: 10, range: [0, 20] }
			},
			contentText: '1公吋 = 10(格)1公分'
		},
		{
			id: 'A3',
			fullId: '1-1.1 A3',
			type: '體感',
			question: '描繪100cm',
			simulator: {
				id: 'RULER_DRAG_ACCUMULATE',
				config: {
					id: 'RULER_DRAG_ACCUMULATE',
					type: 'DRAG_ACCUMULATE',
					target: 20,
					pulls: 5,
					total: 100
				}
			},
			contentText: '1公尺 = 100(格)1公分'
		},
		{
			id: 'A4',
			fullId: '1-1.1 A4',
			type: '體感',
			question: '描繪1cm',
			simulator: {
				id: 'RULER_DRAG_PRECISION',
				config: { id: 'RULER_DRAG_PRECISION', type: 'PRECISION', target: 1, range: [5, 7] }
			},
			contentText: '1公分 = 10(格)1毫米'
		},
		{
			id: 'A4XA3',
			fullId: '1-1.1 A4XA3',
			type: '邏輯',
			question: '課文出現合併了',
			simulator: {
				id: 'QUIZ_UNIT',
				config: { id: 'QUIZ_UNIT' }
			},
			simContent: `
\\begin{array}{lcccccccc}
1\\text{公尺} & = & 100 & \\text{(格)} & \\color{blue}{1\\text{公分}} & & & & \\\\
& & & & \\color{blue}{1\\text{公分}} & = & 10 & \\text{(格)} & \\color{emerald}{1\\text{毫米}} \\\\
\\hline \\\\
1\\text{公尺} & = & 100 & & \\times & & 10 & \\text{(格)} & \\color{emerald}{1\\text{毫米}} \\\\
& = & 10^3 & \\text{毫米} & & & & & 
\\end{array}
			`,
			contentText: '1公尺 = 10^3 毫米'
		},
		{
			id: 'A4XA3-1',
			fullId: '1-1.1 A4XA3-1',
			type: '邏輯',
			question: '進階單位換算挑戰',
			simulator: {
				id: 'QUIZ_UNIT',
				config: { id: 'QUIZ_UNIT' }
			},
			simContent: `
\\begin{array}{ccccccccccccc}
1\\text{公里} & = & 1000 & \\color{rose}{1\\text{公尺}} & & & & & & & & & \\\\
& & 1 & \\color{rose}{1\\text{公尺}} & = & 1000 & \\color{emerald}{1\\text{毫米}} & & & & & & \\\\
& & & & & 1 & \\color{emerald}{1\\text{毫米}} & = & 1000 & \\text{微米} & & & \\\\
& & & & & & & & 1 & \\text{微米} & = & 1000 & \\text{奈米}
\\end{array}
			`,
			contentText: '1公里 = 10^3 公尺'
		}
	]
};
