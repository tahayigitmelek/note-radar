import { ItemView, WorkspaceLeaf } from 'obsidian';
import { AnalyticsStore } from '../store/AnalyticsStore';
import {
	DashboardState,
	NoteAnalytics,
	SortColumn,
} from '../types';

export const ANALYTICS_VIEW_TYPE = 'note-radar-dashboard';

const COLUMN_LABELS: Record<SortColumn, string> = {
	name: 'Note Name',
	viewCount: 'Views',
	firstViewedAt: 'First Viewed',
	lastViewedAt: 'Last Viewed',
	timeSinceLastView: 'Time Since Last View',
};

export class AnalyticsView extends ItemView {
	private store: AnalyticsStore;
	private state: DashboardState;
	private searchInput: HTMLInputElement | null = null;

	constructor(leaf: WorkspaceLeaf, store: AnalyticsStore) {
		super(leaf);
		this.store = store;
		this.state = {
			sortColumn: 'viewCount',
			sortDirection: 'desc',
			searchQuery: '',
			currentPage: 1,
			itemsPerPage: 50,
		};
	}

	getViewType(): string {
		return ANALYTICS_VIEW_TYPE;
	}

	getDisplayText(): string {
		return 'Note Radar dashboard';
	}

	getIcon(): string {
		return 'bar-chart-2';
	}

	async onOpen(): Promise<void> {
		this.render();
	}

	async onClose(): Promise<void> {
		this.contentEl.empty();
	}

	refresh(): void {
		this.render();
	}

	private render(): void {
		const container = this.contentEl;
		container.empty();
		container.addClass('note-radar-dashboard');

		this.renderHeader(container);

		this.renderSummaryCards(container);

		this.renderSearchBar(container);
		this.renderTable(container);
	}

	private renderHeader(container: HTMLElement): void {
		const header = container.createDiv({ cls: 'na-header' });

		const titleRow = header.createDiv({ cls: 'na-header-title-row' });
		titleRow.createEl('h2', {
			text: '📊 Note Radar dashboard',
			cls: 'na-title',
		});
	}

	private renderSummaryCards(container: HTMLElement): void {
		const cards = container.createDiv({ cls: 'na-summary-cards' });

		const totalNotesInVault = this.store.getTotalNotesInVault();
		const totalViewedNotes = this.store.getTotalViewedNotes();
		const totalViews = this.store.getTotalViews();
		const allNotes = this.store.getAllTrackedNotes();

		let mostViewed = '—';
		let mostViewedCount = 0;
		for (const note of allNotes) {
			if (note.viewCount > mostViewedCount) {
				mostViewedCount = note.viewCount;
				mostViewed = this.store.getNoteName(note.filePath);
			}
		}

		this.createSummaryCard(cards, '📝', 'Notes in Vault', `${totalNotesInVault}`, `${totalViewedNotes} viewed`);
		this.createSummaryCard(cards, '👁️', 'Total Views', `${totalViews}`);
		this.createSummaryCard(
			cards,
			'🏆',
			'Most Viewed Note',
			mostViewed,
			mostViewedCount > 0 ? `${mostViewedCount} views` : undefined,
		);
	}

	private createSummaryCard(
		parent: HTMLElement,
		icon: string,
		label: string,
		value: string,
		subtitle?: string,
	): void {
		const card = parent.createDiv({ cls: 'na-summary-card' });
		card.createDiv({ cls: 'na-card-icon', text: icon });
		card.createDiv({ cls: 'na-card-label', text: label });
		card.createDiv({ cls: 'na-card-value', text: value });
		if (subtitle) {
			card.createDiv({ cls: 'na-card-subtitle', text: subtitle });
		}
	}

	private renderSearchBar(container: HTMLElement): void {
		const searchBar = container.createDiv({ cls: 'na-search-bar' });
		const input = searchBar.createEl('input', {
			type: 'text',
			placeholder: '🔍 Search notes...',
			cls: 'na-search-input',
			value: this.state.searchQuery,
		});
		this.searchInput = input;

		input.addEventListener('input', () => {
			this.state.searchQuery = input.value;
			this.state.currentPage = 1;
			this.renderTableAndPagination();
		});
	}

	private tableBody: HTMLElement | null = null;
	private paginationContainer: HTMLElement | null = null;

	private renderTable(container: HTMLElement): void {
		const tableWrapper = container.createDiv({ cls: 'na-table-wrapper' });
		const table = tableWrapper.createEl('table', { cls: 'na-table' });

		const thead = table.createEl('thead');
		const headerRow = thead.createEl('tr');

		const columns: SortColumn[] = [
			'name',
			'viewCount',
			'firstViewedAt',
			'lastViewedAt',
			'timeSinceLastView',
		];

		for (const col of columns) {
			const th = headerRow.createEl('th', {
				cls: `na-th na-th-${col}`,
			});

			const thContent = th.createDiv({ cls: 'na-th-content' });
			thContent.createEl('span', { text: COLUMN_LABELS[col] });

			if (this.state.sortColumn === col) {
				thContent.createEl('span', {
					text: this.state.sortDirection === 'asc' ? ' ▲' : ' ▼',
					cls: 'na-sort-indicator',
				});
			}

			th.addEventListener('click', () => {
				if (this.state.sortColumn === col) {
					this.state.sortDirection =
						this.state.sortDirection === 'asc' ? 'desc' : 'asc';
				} else {
					this.state.sortColumn = col;
					this.state.sortDirection = col === 'name' ? 'asc' : 'desc';
				}
				this.state.currentPage = 1;
				this.render();
			});
		}

		const tbody = table.createEl('tbody');
		this.tableBody = tbody;

		this.paginationContainer = container.createDiv({ cls: 'na-pagination-wrapper' });

		this.populateTableAndPagination(tbody);
	}

	private renderTableAndPagination(): void {
		if (this.tableBody && this.paginationContainer) {
			this.tableBody.empty();
			this.populateTableAndPagination(this.tableBody);
		}
	}

	private populateTableAndPagination(tbody: HTMLElement): void {
		const notes = this.store.getSortedNotes(
			this.state.sortColumn,
			this.state.sortDirection,
			this.state.searchQuery,
		);

		if (notes.length === 0) {
			const emptyRow = tbody.createEl('tr', { cls: 'na-empty-row' });
			const emptyCell = emptyRow.createEl('td', {
				attr: { colspan: '5' },
				cls: 'na-empty-cell',
			});
			emptyCell.createDiv({ cls: 'na-empty-icon', text: '📭' });
			emptyCell.createDiv({
				cls: 'na-empty-text',
				text: this.state.searchQuery
				? 'No notes matching your search.'
				: 'No notes found in the vault.',
			});
			this.renderPaginationControls(0);
			return;
		}

		const totalPages = Math.ceil(notes.length / this.state.itemsPerPage);
		if (this.state.currentPage > totalPages) {
			this.state.currentPage = totalPages;
		}
		if (this.state.currentPage < 1) {
			this.state.currentPage = 1;
		}

		const startIndex = (this.state.currentPage - 1) * this.state.itemsPerPage;
		const endIndex = startIndex + this.state.itemsPerPage;
		const paginatedNotes = notes.slice(startIndex, endIndex);

		for (const note of paginatedNotes) {
			this.renderTableRow(tbody, note);
		}

		this.renderPaginationControls(totalPages);
	}

	private renderPaginationControls(totalPages: number): void {
		if (!this.paginationContainer) return;
		this.paginationContainer.empty();

		if (totalPages <= 1) return;

		const prevBtn = this.paginationContainer.createEl('button', {
			text: '◀ Prev',
			cls: `na-pagination-btn ${this.state.currentPage === 1 ? 'na-disabled' : ''}`,
			attr: this.state.currentPage === 1 ? { disabled: 'true' } : {}
		});
		prevBtn.addEventListener('click', () => {
			if (this.state.currentPage > 1) {
				this.state.currentPage--;
				this.renderTableAndPagination();
			}
		});

		this.paginationContainer.createEl('span', {
			text: `Page ${this.state.currentPage} of ${totalPages}`,
			cls: 'na-pagination-info'
		});

		const nextBtn = this.paginationContainer.createEl('button', {
			text: 'Next ▶',
			cls: `na-pagination-btn ${this.state.currentPage === totalPages ? 'na-disabled' : ''}`,
			attr: this.state.currentPage === totalPages ? { disabled: 'true' } : {}
		});
		nextBtn.addEventListener('click', () => {
			if (this.state.currentPage < totalPages) {
				this.state.currentPage++;
				this.renderTableAndPagination();
			}
		});
	}

	private renderTableRow(tbody: HTMLElement, note: NoteAnalytics): void {
		const isNeverViewed = note.viewCount === 0;
		const row = tbody.createEl('tr', {
			cls: `na-row ${isNeverViewed ? 'na-row-never-viewed' : ''}`,
		});

		const nameCell = row.createEl('td', { cls: 'na-cell na-cell-name' });
		const nameLink = nameCell.createEl('a', {
			text: this.store.getNoteName(note.filePath),
			cls: 'na-note-link',
			attr: { href: '#' },
		});
		nameLink.addEventListener('click', (e) => {
			e.preventDefault();
			const file = this.app.vault.getAbstractFileByPath(note.filePath);
			if (file) {
				void this.app.workspace.openLinkText(note.filePath, '', false);
			}
		});

		const viewCell = row.createEl('td', { cls: 'na-cell na-cell-viewcount' });
		if (isNeverViewed) {
			viewCell.createEl('span', {
				cls: 'na-view-badge na-badge-never',
				text: 'Never viewed',
			});
		} else {
			const badge = viewCell.createEl('span', {
				cls: 'na-view-badge',
				text: `${note.viewCount}`,
			});

			if (note.viewCount >= 50) badge.addClass('na-badge-hot');
			else if (note.viewCount >= 20) badge.addClass('na-badge-warm');
			else if (note.viewCount >= 5) badge.addClass('na-badge-mild');
		}

		row.createEl('td', {
			cls: 'na-cell na-cell-date',
			text: this.store.formatDate(note.firstViewedAt),
		});

		row.createEl('td', {
			cls: 'na-cell na-cell-date',
			text: this.store.formatDate(note.lastViewedAt),
		});

		row.createEl('td', {
			cls: 'na-cell na-cell-elapsed',
			text: this.store.getTimeSinceLastView(note.lastViewedAt),
		});
	}
}
