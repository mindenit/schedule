import { defineStore, skipHydrate } from "pinia"
import { useStorage, StorageSerializers } from "@vueuse/core"

export const useSettingsStore = defineStore("settings", () => {
	const isSnowEnabled = skipHydrate(
		useStorage("snow-effect-enabled", false, undefined, {
			serializer: StorageSerializers.boolean,
		})
	)

	return {
		isSnowEnabled,
	}
})
