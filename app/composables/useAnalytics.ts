import type { AnalyticsEvents } from "~/types/analytics"

/**
 * Centralized analytics composable backed by a self-hosted Rybbit instance.
 *
 * Uses useScript() directly instead of useScriptRybbitAnalytics() because the
 * registry helper assumes the standard cloud path (/script.js) whereas this
 * instance serves the script at /api/script.js.
 *
 * Pageviews are tracked automatically by Rybbit's built-in SPA detection
 * (pushState / popState interception). No manual wiring needed.
 */
export function useAnalytics() {
	// Injects the script tag once globally and ensures window.rybbit is populated.
	useScript(
		{
			src: "https://analytics.mindenit.org/api/script.js",
			defer: true,
			"data-site-id": "c06ec8fba05b",
		},
		{ trigger: "onNuxtReady" },
	)

	function trackEvent<K extends keyof AnalyticsEvents>(
		name: AnalyticsEvents[K] extends never ? K : never,
	): void

	function trackEvent<K extends keyof AnalyticsEvents>(
		name: AnalyticsEvents[K] extends never ? never : K,
		properties: AnalyticsEvents[K],
	): void

	function trackEvent(name: string, properties?: Record<string, unknown>) {
		if (!import.meta.client) return
		window.rybbit?.event(name, properties as Record<string, string | number> | undefined)
	}

	function trackPageview() {
		if (!import.meta.client) return
		window.rybbit?.pageview()
	}

	return { trackEvent, trackPageview }
}
