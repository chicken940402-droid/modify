import { SvelteSet, SvelteMap } from 'svelte/reactivity';
import type { Lesson } from './types';

export class CourseState {
	lessons = $state<Lesson[]>([]);
	currentStageIndex = $state(0);
	unlockedContentIds = new SvelteSet<string>();
	contentCheckedState = new SvelteMap<string, boolean>();
	isSidebarOpen = $state(false);

	// 計時功能相關狀態
	elapsedTime = $state(0);
	timerInterval = $state<number | null>(null);

	constructor(lessons: Lesson[]) {
		this.lessons = lessons;
		if (this.lessons && this.lessons.length > 0) {
			const stage = this.lessons[this.currentStageIndex];
			if (stage && !stage.simulator) {
				this.unlockedContentIds.add(stage.id);
			}
		}
		this.startTimer();
	}

	get currentStage() {
		return this.lessons[this.currentStageIndex];
	}

	// 格式化時間 (MM:SS)
	get formattedTime() {
		const minutes = Math.floor(this.elapsedTime / 60);
		const seconds = this.elapsedTime % 60;
		return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
	}

	startTimer() {
		if (this.timerInterval) return;
		this.timerInterval = setInterval(() => {
			this.elapsedTime++;
		}, 1000) as unknown as number;
	}

	stopTimer() {
		if (this.timerInterval) {
			clearInterval(this.timerInterval);
			this.timerInterval = null;
		}
	}

	resetTimer() {
		this.elapsedTime = 0;
	}

	unlock(id: string) {
		this.unlockedContentIds.add(id);
	}

	isUnlocked(id: string) {
		return this.unlockedContentIds.has(id);
	}

	next() {
		if (this.currentStageIndex < this.lessons.length - 1) {
			this.currentStageIndex++;
			const stage = this.lessons[this.currentStageIndex];
			if (stage && !stage.simulator) {
				this.unlock(stage.id);
			}
			return true;
		} else {
			console.log('恭喜！您已完成所有學習階段！');
			return false;
		}
	}

	prev() {
		if (this.currentStageIndex > 0) {
			this.currentStageIndex--;
			return true;
		}
		return false;
	}

	async advanceStage(stageId: string) {
		const current = this.lessons[this.currentStageIndex];
		if (current && current.id === stageId) {
			await new Promise((r) => setTimeout(r, 300));
			if (this.currentStageIndex < this.lessons.length - 1) {
				this.currentStageIndex++;
				const nextStage = this.lessons[this.currentStageIndex];
				if (nextStage && !nextStage.simulator) {
					this.unlock(nextStage.id);
				}
				return true;
			} else {
				console.log('恭喜！您已完成所有學習階段！');
				return false;
			}
		}
		return false;
	}
}
