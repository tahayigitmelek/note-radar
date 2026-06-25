import { Notice, Plugin, TFile, WorkspaceLeaf } from 'obsidian';
import { AnalyticsStore } from './store/AnalyticsStore';
import { AnalyticsView, ANALYTICS_VIEW_TYPE } from './views/AnalyticsView';

export default class NoteAnalyticsPlugin extends Plugin {
	store!: AnalyticsStore;

	async onload(): Promise<void> {
		this.store = new AnalyticsStore(this);
		await this.store.load();

		this.registerView(ANALYTICS_VIEW_TYPE, (leaf: WorkspaceLeaf) => {
			return new AnalyticsView(leaf, this.store);
		});

		this.addRibbonIcon(
			'bar-chart-2',
			'Note Radar dashboard',
			async (_evt: MouseEvent) => {
				await this.activateDashboard();
			},
		);

		this.addCommand({
			id: 'open-analytics-dashboard',
			name: 'Open analytics dashboard',
			callback: async () => {
				await this.activateDashboard();
			},
		});

		this.addCommand({
			id: 'reset-statistics',
			name: 'Reset statistics',
			callback: async () => {
				await this.store.resetAll();
				new Notice('📊 All analytics data has been reset.');
				this.refreshDashboard();
			},
		});

		this.addCommand({
			id: 'export-statistics-json',
			name: 'Export statistics JSON',
			callback: async () => {
				const json = this.store.exportJSON();
				const fileName = `note-radar-export-${new Date().toISOString().slice(0, 10)}.json`;

				try {
					await this.app.vault.create(fileName, json);
					new Notice(`📁 Statistics exported to "${fileName}".`);
				} catch (error) {
					const existingFile =
						this.app.vault.getAbstractFileByPath(fileName);
					if (existingFile instanceof TFile) {
						await this.app.vault.modify(existingFile, json);
						new Notice(
							`📁 Statistics exported to "${fileName}" (updated).`,
						);
					} else {
						new Notice('❌ An error occurred during export.');
						console.error('Note Radar: Export error', error);
					}
				}
			},
		});

		this.registerEvent(
			this.app.workspace.on('file-open', async (file: TFile | null) => {
				if (file && file.extension === 'md') {
					await this.store.recordView(file.path);
					this.refreshDashboard();
				}
			}),
		);
	}

	onunload(): void {
	}

	async activateDashboard(): Promise<void> {
		const { workspace } = this.app;

		let leaf: WorkspaceLeaf | null = null;
		const existingLeaves = workspace.getLeavesOfType(ANALYTICS_VIEW_TYPE);

		if (existingLeaves.length > 0) {
			leaf = existingLeaves[0] ?? null;
		} else {
			leaf = workspace.getRightLeaf(false);
			if (leaf) {
				await leaf.setViewState({
					type: ANALYTICS_VIEW_TYPE,
					active: true,
				});
			}
		}

		if (leaf) {
			await workspace.revealLeaf(leaf);
		}
	}

	private refreshDashboard(): void {
		const leaves = this.app.workspace.getLeavesOfType(ANALYTICS_VIEW_TYPE);
		for (const leaf of leaves) {
			const view = leaf.view;
			if (view instanceof AnalyticsView) {
				view.refresh();
			}
		}
	}
}
