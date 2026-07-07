import { defineStore, skipHydrate } from "pinia"
import { useStorage, StorageSerializers } from "@vueuse/core"
import { STORAGE_KEYS } from "~/constants/storage"
import { TIMEZONE_LOCAL } from "~/constants/timezones"

export const useSettingsStore = defineStore("settings", () => {
	// useStorage reads from localStorage which is only available on the client.
	// skipHydrate prevents Pinia from serialising these refs into the SSR payload
	// and overwriting the localStorage value on hydration — without it the server's
	// default value (false / true) would clobber what the user had stored.
	// These settings do not affect SSR rendering, so client-only is correct here.
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
	 * useCookie is SSR-safe: the server reads the cookie from the request
	 * headers and renders with the exact same value the client will use,
	 * eliminating hydration mismatches. The client updates the cookie on
	 * change and localStorage is not involved in the SSR path at all.
	 */
	const timezone = useCookie<string>(STORAGE_KEYS.timezone, {
		default: () => TIMEZONE_LOCAL,
		sameSite: "lax",
	})

	return {
		isSnowEnabled,
		isUrlSyncEnabled,
		timezone,
	}
})
