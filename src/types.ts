export interface NoteAnalytics {
	filePath: string;
	viewCount: number;
	firstViewedAt: string;
	lastViewedAt: string;
}

export interface AnalyticsData {
	notes: Record<string, NoteAnalytics>;
	lastUpdated: string;
}

export type SortDirection = 'asc' | 'desc';

export type SortColumn =
	| 'name'
	| 'viewCount'
	| 'firstViewedAt'
	| 'lastViewedAt'
	| 'timeSinceLastView';

export interface DashboardState {
	sortColumn: SortColumn;
	sortDirection: SortDirection;
	searchQuery: string;
	currentPage: number;
	itemsPerPage: number;
}

export function createEmptyAnalyticsData(): AnalyticsData {
	return {
		notes: {},
		lastUpdated: new Date().toISOString(),
	};
}
