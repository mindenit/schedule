import { useStorage } from "@vueuse/core"
import type { AnalyticsEvents } from "~/types/analytics"

// Extend Window with gtag so TypeScript doesn't complain about the global.
declare global {
	interface Window {
		gtag?: (...args: unknown[]) => void
	}
}

/**
 * Centralized analytics composable backed by Google Analytics 4.
 *
 * GA4 is loaded via @nuxt/scripts useScriptGoogleAnalytics() with Google
 * Consent Mode v2. The script initialises immediately but analytics_storage
 * starts as "denied" — no data is sent until the user accepts the banner.
 *
 * When NUXT_PUBLIC_GA_MEASUREMENT_ID is empty the composable returns no-op
 * stubs and no script is loaded. Set the env var and restart to enable.
 *
 * Auto-tracking (page_view, outbound clicks, scroll, video, file_download)
 * is handled by GA4 Enhanced Measurement. Enable it in the GA4 dashboard:
 *   Admin → Data Streams → Web stream → Enhanced measurement → all on.
 *
 * Bootstrap runs once per client session from useAppShell.ts.
 */

export function useAnalytics() {
	const runtimeConfig = useRuntimeConfig()
	const measurementId = runtimeConfig.public.gaMeasurementId as string

	// ── No-op when measurement ID is not configured ───────────────────────────
	if (!measurementId) {
		return { trackEvent: _noop as unknown as typeof trackEventImpl }
	}

	// ── Register GA4 with Consent Mode v2 (deduplicated by Nuxt Scripts) ─────
	// useScriptGoogleAnalytics keyed on "googleAnalytics" — calling this
	// multiple times returns the same singleton instance.
	const { consent } = useScriptGoogleAnalytics({
		id: measurementId,
		// Start with everything denied — data flows only after user accepts.
		defaultConsent: {
			ad_storage: "denied",
			analytics_storage: "denied",
			ad_user_data: "denied",
			ad_personalization: "denied",
		},
	})

	// ── Wire consent state on client ──────────────────────────────────────────
	if (import.meta.client) {
		const { hasConsent } = useConsent()

		// Apply immediately for returning users who already accepted.
		if (hasConsent.value) {
			if (consent) _grantConsent(consent)
			_bootstrapUser()
		}

		// React to banner accept / decline without page reload.
		watch(hasConsent, (granted) => {
			if (granted) {
				if (consent) _grantConsent(consent)
				_bootstrapUser()
			} else {
				if (consent) _revokeConsent(consent)
			}
		})
	}

	// ── Type-safe event tracking ──────────────────────────────────────────────
	function trackEventImpl<K extends keyof AnalyticsEvents>(
		name: AnalyticsEvents[K] extends never ? K : never
	): void

	function trackEventImpl<K extends keyof AnalyticsEvents>(
		name: AnalyticsEvents[K] extends never ? never : K,
		properties: AnalyticsEvents[K]
	): void

	function trackEventImpl(name: string, properties?: Record<string, unknown>) {
		if (!import.meta.client) return
		const { hasConsent } = useConsent()
		if (!hasConsent.value) return
		try {
			window.gtag?.("event", name, properties)
		} catch {
			// Analytics errors must never affect app behaviour
		}
	}

	return { trackEvent: trackEventImpl }
}

// ── Internal helpers ──────────────────────────────────────────────────────────

type GaConsentHandle = NonNullable<ReturnType<typeof useScriptGoogleAnalytics>["consent"]>

function _grantConsent(consent: GaConsentHandle) {
	try {
		consent.update({
			ad_storage: "granted",
			analytics_storage: "granted",
			ad_user_data: "granted",
			ad_personalization: "granted",
		})
	} catch {
		// ignore
	}
}

function _revokeConsent(consent: GaConsentHandle) {
	try {
		consent.update({
			ad_storage: "denied",
			analytics_storage: "denied",
			ad_user_data: "denied",
			ad_personalization: "denied",
		})
	} catch {
		// ignore
	}
}

/**
 * Set GA4 user_id from a stable anonymous UUID.
 * Migrates the old OpenPanel `op-anon-id` localStorage key if present.
 * Runs once per session after consent is granted.
 */
function _bootstrapUser() {
	if (!import.meta.client) return

	// Migrate from old OpenPanel key.
	let profileId: string
	const legacyRaw = localStorage.getItem("op-anon-id")
	if (legacyRaw) {
		try {
			profileId = JSON.parse(legacyRaw) as string
		} catch {
			profileId = crypto.randomUUID()
		}
		localStorage.removeItem("op-anon-id")
		localStorage.setItem(STORAGE_KEYS.analyticsId, JSON.stringify(profileId))
	} else {
		const stored = useStorage<string>(STORAGE_KEYS.analyticsId, () => crypto.randomUUID())
		profileId = stored.value
	}

	// Push user_id and global user properties to GA4.
	try {
		const runtimeConfig = useRuntimeConfig()
		const scheduleStore = useScheduleStore()
		const settingsStore = useSettingsStore()
		const linksStore = useLinksStore()
		const colorMode = useColorMode()

		const linkCount = Object.keys(linksStore.links).length
		const scheduleTypes = [...new Set(scheduleStore.allSchedules.map((s) => s.type))].sort()

		// GA4 user_properties constraints: key ≤ 24 chars, string value ≤ 36 chars.
		window.gtag?.("set", {
			user_id: profileId,
			user_properties: {
				build_id: runtimeConfig.public.buildId,
				schedule_count: scheduleStore.allSchedules.length,
				active_schedule_type: scheduleStore.selectedSchedule?.type ?? "none",
				schedule_types_mix: (scheduleTypes.join("+") || "none").slice(0, 36),
				theme: colorMode.value,
				theme_preference: colorMode.preference,
				reduced_motion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
				device: window.innerWidth < 768 ? "mobile" : "desktop",
				url_sync_enabled: settingsStore.isUrlSyncEnabled,
				timezone_preference: settingsStore.timezone,
				link_count: linkCount,
				has_links: linkCount > 0,
			},
		})
	} catch {
		// ignore
	}
}

function _noop(_name: string, _properties?: Record<string, unknown>) {}
