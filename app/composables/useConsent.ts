import { useStorage } from "@vueuse/core"

/**
 * Analytics consent state management.
 *
 * Persists the user's choice in localStorage so the banner is shown only once.
 * `null`  — user has not yet decided (banner should be shown)
 * `"accepted"` — user consented; analytics may load
 * `"declined"` — user declined; analytics must not load
 *
 * This composable is the single source of truth for consent state.
 * useAnalytics() reads it; ConsentBanner.vue writes it.
 */

type ConsentState = "accepted" | "declined" | null

export function useConsent() {
	const consent = useStorage<ConsentState>(STORAGE_KEYS.analyticsConsent, null)

	const hasConsent = computed(() => consent.value === "accepted")
	const hasDeclined = computed(() => consent.value === "declined")
	const isPending = computed(() => consent.value === null)

	function acceptConsent() {
		consent.value = "accepted"
	}

	function declineConsent() {
		consent.value = "declined"
	}

	function resetConsent() {
		consent.value = null
	}

	return {
		consent: readonly(consent),
		hasConsent,
		hasDeclined,
		isPending,
		acceptConsent,
		declineConsent,
		resetConsent,
	}
}
