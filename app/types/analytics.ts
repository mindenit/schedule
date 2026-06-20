/**
 * Registry of all custom analytics events for Mindenit Schedule.
 *
 * Key   = event name passed to trackEvent()
 * Value = payload shape (use `never` for events with no properties)
 */

export interface AnalyticsEvents {
	// ── Schedule management ──────────────────────────────────────────────────
	/** User adds a new schedule (group / teacher / auditorium). */
	schedule_added: { type: "group" | "teacher" | "auditorium" }
	/** User confirms deletion of the active schedule. */
	schedule_removed: { type: "group" | "teacher" | "auditorium"; total_remaining: number }
	/** User picks a different schedule from the select dropdown. */
	schedule_switched: { type: "group" | "teacher" | "auditorium"; total_schedules: number }

	// ── Calendar navigation ───────────────────────────────────────────────────
	/** User changes the calendar view (day / week / month). */
	view_changed: {
		view: "day" | "week" | "month"
		source: "switcher" | "day_cell" | "sidebar_calendar"
	}
	/** User navigates to a different date period. */
	date_navigated: {
		direction: "prev" | "next" | "today"
		view: "day" | "week" | "month"
		source: "button" | "swipe"
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
	/** User imports a shared links collection from the share page. */
	links_share_accepted: { count: number }

	// ── Filters ───────────────────────────────────────────────────────────────
	/** User closes the filters dialog with at least one active filter. */
	filters_applied: {
		lesson_types: number
		teachers: number
		auditoriums: number
		subjects: number
		groups: number
	}
	/** User clicks the reset button in the filters dialog. */
	filters_reset: never

	// ── ICS export ────────────────────────────────────────────────────────────
	/** User exports the schedule as an .ics file. */
	ics_exported: { schedule_type: "group" | "teacher" | "auditorium" }

	// ── Engagement / acquisition ──────────────────────────────────────────────
	/** User clicks the Play Market / Google Play button. */
	play_market_clicked: never
	/** User clicks the Telegram button. */
	telegram_clicked: never
	/** User toggles the color theme. */
	theme_changed: { theme: "light" | "dark" }
}
