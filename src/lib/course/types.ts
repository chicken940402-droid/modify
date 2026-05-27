export type LessonType = '體感' | '邏輯' | '實驗' | '敘述' | '觀念';

export interface SimulatorConfig {
	id: string; // 模擬器的類型 ID，例如 'RULER_DRAG'
	target?: number;
	range?: [number, number];
	pulls?: number;
	total?: number;
	[key: string]: any;
}

export interface Lesson {
	id: string;
	fullId?: string;
	type: LessonType;
	question: string;
	simulator?: {
		id: string;
		config: SimulatorConfig;
	};
	simContent?: string;
	contentText: string;
}

export interface CourseData {
	chapter: string;
	section: string;
	title: string;
	lessons: Lesson[];
}
