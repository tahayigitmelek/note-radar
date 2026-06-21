import { Plugin } from 'obsidian';
import {
	AnalyticsData,
	NoteAnalytics,
	SortColumn,
	SortDirection,
	createEmptyAnalyticsData,
} from '../types';


export class AnalyticsStore {
	private data: AnalyticsData;
	private plugin: Plugin;

	constructor(plugin: Plugin) {
		this.plugin = plugin;
		this.data = createEmptyAnalyticsData();
	}

	async load(): Promise<void> {
		try {
			const loadedData = (await this.plugin.loadData()) as Partial<AnalyticsData> | null | undefined;
			if (loadedData) {
				this.data = Object.assign(createEmptyAnalyticsData(), loadedData);
			} else {
				this.data = createEmptyAnalyticsData();
			}
		} catch (error) {
			console.error('Note Analytics: Error loading data', error);
			this.data = createEmptyAnalyticsData();
		}
	}

	async save(): Promise<void> {
		try {
			this.data.lastUpdated = new Date().toISOString();
			await this.plugin.saveData(this.data);
		} catch (error) {
			console.error('Note Analytics: Error saving data', error);
		}
	}

	async recordView(filePath: string): Promise<void> {
		const now = new Date().toISOString();
		const existing = this.data.notes[filePath];

		if (existing) {
			existing.viewCount += 1;
			existing.lastViewedAt = now;
		} else {
			this.data.notes[filePath] = {
				filePath,
				viewCount: 1,
				firstViewedAt: now,
				lastViewedAt: now,
			};
		}

		await this.save();
	}

	getAllTrackedNotes(): NoteAnalytics[] {
		return Object.values(this.data.notes);
	}

	getAllNotesIncludingUnviewed(): NoteAnalytics[] {
		const allFiles = this.plugin.app.vault.getMarkdownFiles();
		const result: NoteAnalytics[] = [];

		for (const file of allFiles) {
			const existing = this.data.notes[file.path];
			if (existing) {
				result.push(existing);
			} else {
				result.push({
					filePath: file.path,
					viewCount: 0,
					firstViewedAt: '',
					lastViewedAt: '',
				});
			}
		}

		return result;
	}

	getNote(filePath: string): NoteAnalytics | undefined {
		return this.data.notes[filePath];
	}

	getTotalNotesInVault(): number {
		return this.plugin.app.vault.getMarkdownFiles().length;
	}

	getTotalViewedNotes(): number {
		return Object.keys(this.data.notes).length;
	}

	getTotalViews(): number {
		return this.getAllTrackedNotes().reduce((sum, note) => sum + note.viewCount, 0);
	}

	getSortedNotes(
		sortColumn: SortColumn,
		sortDirection: SortDirection,
		searchQuery: string = '',
	): NoteAnalytics[] {
		let notes = this.getAllNotesIncludingUnviewed();

		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			notes = notes.filter((note) =>
				this.getNoteName(note.filePath).toLowerCase().includes(query),
			);
		}

		notes.sort((a, b) => {
			let comparison = 0;

			switch (sortColumn) {
				case 'name':
					comparison = this.getNoteName(a.filePath).localeCompare(
						this.getNoteName(b.filePath),
						'en',
					);
					break;
				case 'viewCount':
					comparison = a.viewCount - b.viewCount;
					break;
				case 'firstViewedAt': {
					const aFirst = a.firstViewedAt ? new Date(a.firstViewedAt).getTime() : 0;
					const bFirst = b.firstViewedAt ? new Date(b.firstViewedAt).getTime() : 0;
					comparison = aFirst - bFirst;
					break;
				}
				case 'lastViewedAt': {
					const aLast = a.lastViewedAt ? new Date(a.lastViewedAt).getTime() : 0;
					const bLast = b.lastViewedAt ? new Date(b.lastViewedAt).getTime() : 0;
					comparison = aLast - bLast;
					break;
				}
				case 'timeSinceLastView': {
					const aTime = a.lastViewedAt ? new Date(a.lastViewedAt).getTime() : 0;
					const bTime = b.lastViewedAt ? new Date(b.lastViewedAt).getTime() : 0;
					comparison = aTime - bTime;
					break;
				}
			}

			return sortDirection === 'asc' ? comparison : -comparison;
		});

		return notes;
	}

	getNoteName(filePath: string): string {
		const parts = filePath.split('/');
		const fileName = parts[parts.length - 1] ?? filePath;
		return fileName.replace(/\.md$/, '');
	}

	getTimeSinceLastView(lastViewedAt: string): string {
		if (!lastViewedAt) return 'Never viewed';

		const now = new Date();
		const lastView = new Date(lastViewedAt);
		const diffMs = now.getTime() - lastView.getTime();

		const minutes = Math.floor(diffMs / (1000 * 60));
		const hours = Math.floor(diffMs / (1000 * 60 * 60));
		const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
		const weeks = Math.floor(days / 7);
		const months = Math.floor(days / 30);

		if (minutes < 1) return 'Just now';
		if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
		if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
		if (days < 7) return `${days} day${days !== 1 ? 's' : ''} ago`;
		if (weeks < 4) return `${weeks} week${weeks !== 1 ? 's' : ''} ago`;
		return `${months} month${months !== 1 ? 's' : ''} ago`;
	}

	formatDate(isoDate: string): string {
		if (!isoDate) return '—';

		const date = new Date(isoDate);
		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});
	}

	async resetAll(): Promise<void> {
		this.data = createEmptyAnalyticsData();
		await this.save();
	}

	exportJSON(): string {
		return JSON.stringify(this.data, null, 2);
	}
}
