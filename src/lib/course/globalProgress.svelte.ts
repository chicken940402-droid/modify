import { SvelteMap } from 'svelte/reactivity';

export type ChapterStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

export class GlobalProgress {
	// 儲存每個章節的狀態
	chapterStatusMap = new SvelteMap<string, ChapterStatus>();
	// 追蹤目前正在學習的章節 ID
	currentChapterId = $state('1');

	constructor() {
		// 初始化預設值或從 localStorage 載入
		if (typeof localStorage !== 'undefined') {
			const saved = localStorage.getItem('global_chapter_progress');
			const savedCurrent = localStorage.getItem('global_current_chapter');

			if (saved) {
				const data = JSON.parse(saved);
				Object.entries(data).forEach(([key, value]) => {
					this.chapterStatusMap.set(key, value as ChapterStatus);
				});
			} else {
				this.chapterStatusMap.set('1', 'COMPLETED');
				this.chapterStatusMap.set('2', 'IN_PROGRESS');
				this.chapterStatusMap.set('3', 'NOT_STARTED');
			}

			if (savedCurrent) {
				this.currentChapterId = savedCurrent;
			}
		}
	}

	updateChapterStatus(chapterId: string, status: ChapterStatus) {
		this.chapterStatusMap.set(chapterId, status);
		this.save();
	}

	markChapterComplete(chapterId: string) {
		this.updateChapterStatus(chapterId, 'COMPLETED');
	}

	updateCurrentChapter(chapterId: string) {
		this.currentChapterId = chapterId;
		// 當進入新章節時，若該章節為「未開始」，自動改為「進行中」
		if (this.getChapterStatus(chapterId) === 'NOT_STARTED') {
			this.updateChapterStatus(chapterId, 'IN_PROGRESS');
		}
		this.save();
	}

	getChapterStatus(chapterId: string): ChapterStatus {
		return this.chapterStatusMap.get(chapterId) || 'NOT_STARTED';
	}

	private save() {
		if (typeof localStorage !== 'undefined') {
			const data: Record<string, string> = {};
			this.chapterStatusMap.forEach((value, key) => {
				data[key] = value;
			});
			localStorage.setItem('global_chapter_progress', JSON.stringify(data));
			localStorage.setItem('global_current_chapter', this.currentChapterId);
		}
	}
}

export const globalProgress = new GlobalProgress();
