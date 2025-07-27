export const useFiltersStore = defineStore("filters", () => {
	const lessonTypesFilters = ref<string[]>([])
	const teachersFilters = ref<number[]>([])
	const auditoriumsFilters = ref<number[]>([])
	const subjectsFilters = ref<number[]>([])
	const groupsFilters = ref<number[]>([])
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
						const parsed = JSON.parse(saved)
						lessonTypesFilters.value = parsed.lessonTypes || []
						teachersFilters.value = parsed.teachers || []
						auditoriumsFilters.value = parsed.auditoriums || []
						subjectsFilters.value = parsed.subjects || []
						groupsFilters.value = parsed.groups || []
					} catch {
						clearAllFilters()
					}
				} else {
					clearAllFilters()
				}
			}
		}
	}

	const saveFilters = () => {
		if (import.meta.client && currentScheduleKey) {
			const filters = {
				lessonTypes: lessonTypesFilters.value,
				teachers: teachersFilters.value,
				auditoriums: auditoriumsFilters.value,
				subjects: subjectsFilters.value,
				groups: groupsFilters.value,
			}
			localStorage.setItem(`filters-${currentScheduleKey}`, JSON.stringify(filters))
		}
	}

	const clearAllFilters = () => {
		lessonTypesFilters.value = []
		teachersFilters.value = []
		auditoriumsFilters.value = []
		subjectsFilters.value = []
		groupsFilters.value = []
	}

	const toggleLessonTypeFilter = (filterId: string) => {
		const index = lessonTypesFilters.value.indexOf(filterId)
		if (index > -1) {
			lessonTypesFilters.value.splice(index, 1)
		} else {
			lessonTypesFilters.value.push(filterId)
		}
		saveFilters()
		version.value++
	}

	const toggleTeacherFilter = (filterId: number) => {
		const index = teachersFilters.value.indexOf(filterId)
		if (index > -1) {
			teachersFilters.value.splice(index, 1)
		} else {
			teachersFilters.value.push(filterId)
		}
		saveFilters()
		version.value++
	}

	const toggleAuditoriumFilter = (filterId: number) => {
		const index = auditoriumsFilters.value.indexOf(filterId)
		if (index > -1) {
			auditoriumsFilters.value.splice(index, 1)
		} else {
			auditoriumsFilters.value.push(filterId)
		}
		saveFilters()
		version.value++
	}

	const toggleSubjectFilter = (filterId: number) => {
		const index = subjectsFilters.value.indexOf(filterId)
		if (index > -1) {
			subjectsFilters.value.splice(index, 1)
		} else {
			subjectsFilters.value.push(filterId)
		}
		saveFilters()
		version.value++
	}

	const toggleGroupFilter = (filterId: number) => {
		const index = groupsFilters.value.indexOf(filterId)
		if (index > -1) {
			groupsFilters.value.splice(index, 1)
		} else {
			groupsFilters.value.push(filterId)
		}
		saveFilters()
		version.value++
	}

	const isLessonTypeActive = (filterId: string) => {
		return lessonTypesFilters.value.includes(filterId)
	}

	const isTeacherActive = (filterId: number) => {
		return teachersFilters.value.includes(filterId)
	}

	const isAuditoriumActive = (filterId: number) => {
		return auditoriumsFilters.value.includes(filterId)
	}

	const isSubjectActive = (filterId: number) => {
		return subjectsFilters.value.includes(filterId)
	}

	const isGroupActive = (filterId: number) => {
		return groupsFilters.value.includes(filterId)
	}

	const clearAll = () => {
		clearAllFilters()
		saveFilters()
		version.value++
	}

	const hasActive = computed(
		() =>
			lessonTypesFilters.value.length > 0 ||
			teachersFilters.value.length > 0 ||
			auditoriumsFilters.value.length > 0 ||
			subjectsFilters.value.length > 0 ||
			groupsFilters.value.length > 0
	)

	const activeFilters = computed(() => ({
		lessonTypes: lessonTypesFilters.value,
		teachers: teachersFilters.value,
		auditoriums: auditoriumsFilters.value,
		subjects: subjectsFilters.value,
		groups: groupsFilters.value,
	}))

	return {
		lessonTypesFilters,
		teachersFilters,
		auditoriumsFilters,
		subjectsFilters,
		groupsFilters,
		activeFilters: readonly(activeFilters),
		version: readonly(version),
		hasActive: readonly(hasActive),
		loadFilters,
		saveFilters,
		toggleLessonTypeFilter,
		toggleTeacherFilter,
		toggleAuditoriumFilter,
		toggleSubjectFilter,
		toggleGroupFilter,
		isLessonTypeActive,
		isTeacherActive,
		isAuditoriumActive,
		isSubjectActive,
		isGroupActive,
		clearAll,
	}
})
