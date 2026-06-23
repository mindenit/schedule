import { defineStore, skipHydrate } from "pinia"
import { useStorage, StorageSerializers } from "@vueuse/core"
import { STORAGE_KEYS } from "~/constants/storage"
import { TIMEZONE_LOCAL } from "~/constants/timezones"

export const useSettingsStore = defineStore("settings", () => {
	const isSnowEnabled = skipHydrate(
		useStorage(STORAGE_KEYS.snowEffect, false, undefined, {
			serializer: StorageSerializers.boolean,
		})
	)

	const isUrlSyncEnabled = skipHydrate(
		useStorage(STORAGE_KEYS.urlSync, true, undefined, {
			serializer: StorageSerializers.boolean,
		})
	)

	/**
	 * IANA timezone string or the sentinel "local" (browser default).
	 * Resolved to an actual IANA string at runtime via resolveTimezone().
	 *
	 * We use useState as the SSR-stable layer: the server renders with the
	 * default ("local"), the client revives the same value from the Nuxt
	 * payload (no hydration mismatch), and then useStorage syncs with
	 * localStorage after mount. The _storage ref is the persistent write
	 * target; useState reads it on the server and on first CSR render.
	 */
	const _storage = skipHydrate(useStorage(STORAGE_KEYS.timezone, TIMEZONE_LOCAL))
	const _ssrStable = useState<string>("settings:timezone", () => TIMEZONE_LOCAL)

	// After mount, pull the real localStorage value into the SSR-stable state
	// and keep them in sync going forward.
	if (import.meta.client) {
		_ssrStable.value = _storage.value
		watch(_storage, (v) => {
			_ssrStable.value = v
		})
		watch(_ssrStable, (v) => {
			_storage.value = v
		})
	}

	// Expose the SSR-stable ref as `timezone` so all consumers (useTimezone,
	// calendar store) see "local" on the server and the real value on client
	// after the first tick — eliminating the hydration mismatch.
	const timezone = _ssrStable

	return {
		isSnowEnabled,
		isUrlSyncEnabled,
		timezone,
	}
})
