import type { AnalyticsEvents } from "~/types/analytics"

/**
 * Centralized analytics composable backed by OpenPanel.
 *
 * The @openpanel/nuxt module handles script injection and auto-tracking
 * (screen views, outgoing links, data-track attributes) via nuxt.config.ts.
 * This composable wraps useOpenPanel() and exposes a type-safe trackEvent()
 * whose overload signatures are identical to the rybbit-era API so every
 * existing call site continues to compile and work without modification.
 *
 * Bootstrap (anonymous profile ID + global properties) runs once per client
 * session when useAnalytics() is first called from useAppShell.ts.
 */
export function useAnalytics() {
	const op = useOpenPanel()

	// ── Anonymous stable identity ────────────────────────────────────────────
	// Generate a random UUID on first visit and persist it in localStorage so
	// OpenPanel can build per-user profiles and session histories without any PII.
	if (import.meta.client) {
		const profileId = useLocalStorage("op-anon-id", () => randomUUID())

		op.identify({ profileId: profileId.value })
	}

	// ── Global properties (attached to every event) ───────────────────────────
	if (import.meta.client) {
		const runtimeConfig = useRuntimeConfig()
		const scheduleStore = useScheduleStore()
		const settingsStore = useSettingsStore()
		const linksStore = useLinksStore()
		const colorMode = useColorMode()

		const linkCount = Object.keys(linksStore.links).length
		const scheduleTypes = [...new Set(scheduleStore.allSchedules.map((s) => s.type))].sort()

		op.setGlobalProperties({
			// App context
			build_id: runtimeConfig.public.buildId,
			// Schedule context
			schedule_count: scheduleStore.allSchedules.length,
			active_schedule_type: scheduleStore.selectedSchedule?.type ?? "none",
			schedule_types_mix: scheduleTypes.join("+") || "none",
			// Theme / accessibility
			theme: colorMode.value,
			theme_preference: colorMode.preference,
			reduced_motion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
			// Device
			device: window.innerWidth < 768 ? "mobile" : "desktop",
			// Settings
			url_sync_enabled: settingsStore.isUrlSyncEnabled,
			timezone_preference: settingsStore.timezone,
			// Links
			link_count: linkCount,
			has_links: linkCount > 0,
		})
	}

	// ── Type-safe event tracking ──────────────────────────────────────────────
	function trackEvent<K extends keyof AnalyticsEvents>(
		name: AnalyticsEvents[K] extends never ? K : never
	): void

	function trackEvent<K extends keyof AnalyticsEvents>(
		name: AnalyticsEvents[K] extends never ? never : K,
		properties: AnalyticsEvents[K]
	): void

	function trackEvent(name: string, properties?: Record<string, unknown>) {
		if (!import.meta.client) return
		op.track(name, properties)
	}

	// ── Profile counters ───────────────────────────────────────────────────────
	// Increment a lifetime counter on the anonymous profile.
	function incrementProfile(property: string, value = 1) {
		if (!import.meta.client) return
		const profileId = localStorage.getItem("op-anon-id")
		if (!profileId) return
		const id = JSON.parse(profileId) as string
		op.increment({ profileId: id, property, value })
	}

	return { trackEvent, incrementProfile }
}
