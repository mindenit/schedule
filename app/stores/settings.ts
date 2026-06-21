import { defineStore, skipHydrate } from "pinia"
import { useStorage, StorageSerializers } from "@vueuse/core"
import { TIMEZONE_LOCAL } from "~/constants/timezones"

export const useSettingsStore = defineStore("settings", () => {
	const isSnowEnabled = skipHydrate(
		useStorage("snow-effect-enabled", false, undefined, {
			serializer: StorageSerializers.boolean,
		})
	)

	const isUrlSyncEnabled = skipHydrate(
		useStorage("url-sync-enabled", true, undefined, {
			serializer: StorageSerializers.boolean,
		})
	)

	/**
	 * IANA timezone string or the sentinel "local" (browser default).
	 * Resolved to an actual IANA string at runtime via resolveTimezone().
	 */
	const timezone = skipHydrate(useStorage("timezone", TIMEZONE_LOCAL))

	return {
		isSnowEnabled,
		isUrlSyncEnabled,
		timezone,
	}
})
