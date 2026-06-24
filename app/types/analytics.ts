/**
 * Registry of all custom analytics events for Mindenit Schedule.
 *
 * Key   = event name passed to trackEvent()
 * Value = payload shape (use `never` for events with no properties)
 *
 * OpenPanel auto-tracks: screen views, outgoing-link clicks, data-track attributes.
 * Everything here is our custom instrumentation on top of that baseline.
 */

export interface AnalyticsEvents {
	// ── Schedule management ──────────────────────────────────────────────────
	/** User adds a new schedule (group / teacher / auditorium). */
	schedule_added: { type: "group" | "teacher" | "auditorium" }
	/** User confirms deletion of the active schedule. */
	schedule_removed: { type: "group" | "teacher" | "auditorium"; total_remaining: number }
	/** User picks a different schedule from the select dropdown. */
	schedule_switched: { type: "group" | "teacher" | "auditorium"; total_schedules: number }
	/** User types in the schedule search field inside AddDialog. */
	schedule_search_used: { has_results: boolean }

	// ── Calendar navigation ───────────────────────────────────────────────────
	/** User changes the calendar view (day / week / month / year). */
	view_changed: {
		view: "day" | "week" | "month" | "year"
		source: "switcher" | "day_cell" | "sidebar_calendar" | "keyboard" | "year_view"
	}
	/** User navigates to a different date period. */
	date_navigated: {
		direction: "prev" | "next" | "today"
		view: "day" | "week" | "month"
		source: "button" | "swipe" | "keyboard"
	}

	// ── Event interaction ─────────────────────────────────────────────────────
	/** User opens an event popover to see details. */
	event_opened: { lesson_type: string }

	// ── Links ─────────────────────────────────────────────────────────────────
	/** User saves a new link to an event. */
	link_added: never
	/** User saves changes to an existing link. */
	link_edited: never
	/** User deletes a link. */
	link_deleted: never
	/** User clicks through to an external link URL. */
	link_opened: never
	/** User exports links to a JSON file. */
	links_exported: { scope: "all" | "selected"; count: number }
	/** User imports links from a JSON file. */
	links_imported: { count: number }
	/** User generates a sharable links URL. */
	links_shared: { count: number }
	/** User copies the generated sharable URL to clipboard. */
	links_share_url_copied: never
	/** User imports a shared links collection from the share page. */
	links_share_accepted: { count: number }

	// ── Add dialog ────────────────────────────────────────────────────────────
	/** User switches tabs inside the Add Schedule dialog. */
	add_dialog_tab_changed: { tab: "group" | "teacher" | "auditorium" }

	// ── Filters ───────────────────────────────────────────────────────────────
	/** User opens the filters dialog. */
	filters_opened: never
	/** User closes the filters dialog with at least one active filter. */
	filters_applied: {
		lesson_types: number
		teachers: number
		auditoriums: number
		subjects: number
		groups_count: number
	}
	/** User clicks the reset button in the filters dialog. */
	filters_reset: never

	// ── ICS export ────────────────────────────────────────────────────────────
	/** User exports the schedule as an .ics file. */
	ics_exported: { schedule_type: "group" | "teacher" | "auditorium" }

	// ── Settings ──────────────────────────────────────────────────────────────
	/** User opens the settings dialog. */
	settings_opened: never
	/** User switches to a different tab inside the settings dialog. */
	settings_tab_changed: { tab: "schedule" | "links" | "bug" }
	/** User changes a setting value (toggle or select). */
	settings_changed: { setting: string; value: unknown }
	/** User copies diagnostics info to clipboard from the settings panel. */
	diagnostics_copied: never

	// ── Errors ────────────────────────────────────────────────────────────────
	/** An unhandled app-level error was presented to the user. */
	app_error: { status: number; source: "page" | "calendar" }

	// ── Onboarding / acquisition ──────────────────────────────────────────────
	/** First time the app is opened with no schedules configured. */
	first_visit: never

	// ── Calendar UI ───────────────────────────────────────────────────────────
	/** User opens the overflow "+N more" popover in the month view. */
	more_events_opened: never
	/** User resets filters from the calendar empty-state overlay. */
	empty_state_filters_reset: never
	/** User opens the keyboard shortcuts dialog (? key). */
	shortcuts_dialog_opened: never

	// ── Engagement / acquisition ──────────────────────────────────────────────
	/** User clicks the Play Market / Google Play button. */
	play_market_clicked: never
	/** User clicks the Telegram button. */
	telegram_clicked: never
	/** User toggles the color theme. */
	theme_changed: { theme: "light" | "dark" }
}
