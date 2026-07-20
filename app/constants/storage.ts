/**
 * Centralized storage key registry.
 *
 * All keys use the `mindenit:` namespace prefix. Keep this file as the single
 * source of truth — never sprinkle raw key strings across stores or middleware.
 *
 * Browsers that previously stored data under the unprefixed legacy keys (e.g.
 * `all-schedules`, `selected-schedule`) will silently re-initialize on first
 * load: we deliberately do not migrate. The deployed Nuxt 3 frontend still
 * owns those keys.
 */
export const STORAGE_KEYS = {
	// Schedule selection
	schedules: "mindenit:schedules",
	selectedSchedule: "mindenit:selected-schedule",

	// Calendar view (cookie — SSR-readable)
	calendarView: "mindenit:calendar-view",

	// Filters (per-schedule). Pass `${scheduleType}-${scheduleId}` as the suffix.
	filters: (scheduleType: string, scheduleId: string | number) =>
		`mindenit:filters:${scheduleType}-${scheduleId}`,

	// Dialog manager bookkeeping
	dialogsShown: "mindenit:dialogs-shown",

	// User-added meeting links per subject/event-type
	links: "mindenit:links",

	// Per-feature settings
	snowEffect: "mindenit:settings:snow-effect",
	urlSync: "mindenit:settings:url-sync",
	timezone: "mindenit:settings:timezone",

	// Maintenance bypass cookie (set via /maintenance dev access flow)
	devAccess: "mindenit:dev-access",

	// Analytics consent ("accepted" | "declined" | null means not yet decided)
	analyticsConsent: "mindenit:analytics-consent",

	// Anonymous analytics ID — stable UUID persisted across sessions for GA4 user_id
	analyticsId: "mindenit:anon-id",
} as const

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS]
