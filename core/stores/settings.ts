import { defineStore } from "pinia"
import { useStorage, StorageSerializers } from "@vueuse/core"

export const useSettingsStore = defineStore("settings", () => {
	const isSnowEnabled = useStorage("snow-effect-enabled", true, undefined, {
		serializer: StorageSerializers.boolean,
	})

	return {
		isSnowEnabled,
	}
})
