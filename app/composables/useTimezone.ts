import { formatInTimeZone } from "date-fns-tz"
import { uk } from "date-fns/locale"
import type { Locale } from "date-fns"
import { storeToRefs } from "pinia"
import { resolveTimezone } from "~/constants/timezones"
import { useSettingsStore } from "~/stores/settings"

/**
 * Returns the resolved IANA timezone string from user settings,
 * falling back to the browser's local timezone when set to "local".
 */
export const useTimezone = () => {
	const { timezone } = storeToRefs(useSettingsStore())

	const effectiveTimezone = computed(() => resolveTimezone(timezone.value))

	/**
	 * Format a date/timestamp in the user's selected timezone.
	 * Accepts a Date, ISO string, or Unix seconds number.
	 */
	const tzFormat = (
		date: Date | string | number,
		formatStr: string,
		options?: { locale?: Locale }
	): string => {
		const d = typeof date === "number" ? new Date(date * 1000) : new Date(date)
		return formatInTimeZone(d, effectiveTimezone.value, formatStr, {
			locale: uk,
			...options,
		})
	}

	return {
		timezone,
		effectiveTimezone,
		tzFormat,
	}
}
