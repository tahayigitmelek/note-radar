# Note Metrics

Note Metrics is an Obsidian plugin that automatically tracks view statistics for the notes in your vault. It helps you understand which notes you revisit most often, which notes have never been opened, and how your vault activity changes over time.

## Features

**Automatic View Tracking:** Automatically records a view whenever you open a Markdown note in your vault.

**Analytics Dashboard:** Displays your note statistics in a dedicated Obsidian view with summary cards showing total notes in the vault, viewed notes, total views, and your most viewed note.

**Visual Badges:** Easily identify popular notes with view count badges (Hot, Warm, Mild) and quickly spot files with a dedicated "Never viewed" badge.

**Search and Sorting:** Search notes by name and sort the dashboard by note name, view count, first viewed date, last viewed date, or time since last view.

**Pagination:** Efficiently browse through large vaults with built-in pagination (50 items per page) and navigation controls.

**Unviewed Notes:** Shows notes that have not been viewed yet, making it easy to spot untouched or forgotten files.

**Quick Navigation:** Select any note in the dashboard table to open it directly in Obsidian.

**JSON Export:** Export your analytics data as a JSON file for backups, manual review, or external analysis.

**Reset Statistics:** Clear all recorded analytics data from the Command Palette when you want to start fresh.

**Local Storage:** Your analytics data is stored locally through Obsidian's plugin data system, so it stays inside your vault/plugin environment.

## Usage

**Tracking Views:** Enable the plugin and open any Markdown note. Note Metrics will automatically increment that note's view count.

**Opening the Dashboard:** Select the bar chart icon in the left ribbon, or use the **Open analytics dashboard** command from the Command Palette.

**Exploring Notes:** Use the dashboard search box to filter notes, then select table headers to change sorting. Navigate through pages using the Prev and Next buttons at the bottom.

**Opening a Note:** Select a note name in the dashboard table to open that note directly.

**Exporting Data:** Use the **Export statistics JSON** command from the Command Palette. The plugin creates a `note-metrics-export-YYYY-MM-DD.json` file in your vault.

**Resetting Data:** Use the **Reset statistics** command from the Command Palette to clear all recorded view statistics.
