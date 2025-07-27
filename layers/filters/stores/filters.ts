export const useFiltersStore = defineStore("filters", () => {
	const activeFilters = ref<string[]>([])
	const version = ref(0)

	let currentScheduleKey = ""

	const loadFilters = (scheduleId: string | number, scheduleType: string) => {
		const key = `${scheduleType}-${scheduleId}`

		if (key !== currentScheduleKey) {
			currentScheduleKey = key

			if (import.meta.client) {
				const saved = localStorage.getItem(`filters-${key}`)
				if (saved) {
					try {
						activeFilters.value = JSON.parse(saved)
					} catch {
						activeFilters.value = []
					}
				} else {
					activeFilters.value = []
				}
			}
		}
	}

	const saveFilters = () => {
		if (import.meta.client && currentScheduleKey) {
			localStorage.setItem(`filters-${currentScheduleKey}`, JSON.stringify(activeFilters.value))
		}
	}

	const toggleFilter = (filterId: string) => {
		const index = activeFilters.value.indexOf(filterId)

		if (index > -1) {
			activeFilters.value.splice(index, 1)
		} else {
			activeFilters.value.push(filterId)
		}

		saveFilters()
		version.value++
	}

	const isActive = (filterId: string) => {
		return activeFilters.value.includes(filterId)
	}

	const clearAll = () => {
		activeFilters.value = []
		saveFilters()
		version.value++
	}

	const hasActive = computed(() => activeFilters.value.length > 0)

	return {
		activeFilters: readonly(activeFilters),
		version: readonly(version),
		hasActive: readonly(hasActive),
		loadFilters,
		toggleFilter,
		isActive,
		clearAll,
	}
})
