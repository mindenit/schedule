import { STORAGE_KEYS } from "~/constants/storage"

type FilterKey = "lessonTypes" | "teachers" | "auditoriums" | "subjects" | "groups"

type FilterValue<K extends FilterKey> = K extends "lessonTypes" ? string : number

type FilterState = {
	lessonTypes: string[]
	teachers: number[]
	auditoriums: number[]
	subjects: number[]
	groups: number[]
}

const emptyState = (): FilterState => ({
	lessonTypes: [],
	teachers: [],
	auditoriums: [],
	subjects: [],
	groups: [],
})

export const useFiltersStore = defineStore("filters", () => {
	const state = ref<FilterState>(emptyState())

	let currentStorageKey = ""

	const loadFilters = (scheduleId: string | number, scheduleType: string) => {
		const key = STORAGE_KEYS.filters(scheduleType, scheduleId)
		if (key === currentStorageKey) return
		currentStorageKey = key

		if (!import.meta.client) return

		const saved = localStorage.getItem(key)
		if (!saved) {
			state.value = emptyState()
			return
		}

		try {
			const parsed = JSON.parse(saved) as Partial<FilterState>
			state.value = {
				lessonTypes: parsed.lessonTypes ?? [],
				teachers: parsed.teachers ?? [],
				auditoriums: parsed.auditoriums ?? [],
				subjects: parsed.subjects ?? [],
				groups: parsed.groups ?? [],
			}
		} catch {
			state.value = emptyState()
		}
	}

	const saveFilters = () => {
		if (!import.meta.client || !currentStorageKey) return
		localStorage.setItem(currentStorageKey, JSON.stringify(state.value))
	}

	const toggle = <K extends FilterKey>(key: K, value: FilterValue<K>) => {
		const arr = state.value[key] as FilterValue<K>[]
		const index = arr.indexOf(value)
		if (index > -1) arr.splice(index, 1)
		else arr.push(value)
		saveFilters()
	}

	const isActive = <K extends FilterKey>(key: K, value: FilterValue<K>) => {
		return (state.value[key] as FilterValue<K>[]).includes(value)
	}

	const clearAll = () => {
		state.value = emptyState()
		saveFilters()
	}

	// Per-type refs (kept for backwards-compatible reactivity in templates / queries).
	const lessonTypesFilters = computed(() => state.value.lessonTypes)
	const teachersFilters = computed(() => state.value.teachers)
	const auditoriumsFilters = computed(() => state.value.auditoriums)
	const subjectsFilters = computed(() => state.value.subjects)
	const groupsFilters = computed(() => state.value.groups)

	// Per-type toggles / isActive wrappers preserve the previous public API so call sites
	// can opt into the generic `toggle(key, value)` form gradually.
	const toggleLessonTypeFilter = (id: string) => toggle("lessonTypes", id)
	const toggleTeacherFilter = (id: number) => toggle("teachers", id)
	const toggleAuditoriumFilter = (id: number) => toggle("auditoriums", id)
	const toggleSubjectFilter = (id: number) => toggle("subjects", id)
	const toggleGroupFilter = (id: number) => toggle("groups", id)

	const isLessonTypeActive = (id: string) => isActive("lessonTypes", id)
	const isTeacherActive = (id: number) => isActive("teachers", id)
	const isAuditoriumActive = (id: number) => isActive("auditoriums", id)
	const isSubjectActive = (id: number) => isActive("subjects", id)
	const isGroupActive = (id: number) => isActive("groups", id)

	const hasActive = computed(
		() =>
			state.value.lessonTypes.length > 0 ||
			state.value.teachers.length > 0 ||
			state.value.auditoriums.length > 0 ||
			state.value.subjects.length > 0 ||
			state.value.groups.length > 0
	)

	const activeCount = computed(
		() =>
			state.value.lessonTypes.length +
			state.value.teachers.length +
			state.value.auditoriums.length +
			state.value.subjects.length +
			state.value.groups.length
	)

	const activeFilters = computed(() => ({ ...state.value }))

	/**
	 * Returns the filter slice a given entity's schedule API accepts.
	 * Encodes the per-type whitelist that used to live in `useScheduleQuery`.
	 *
	 * - group       → lessonTypes, teachers, auditoriums, subjects
	 * - teacher     → lessonTypes, groups,   auditoriums, subjects
	 * - auditorium  → lessonTypes, teachers, groups,      subjects
	 */
	type FiltersForType = {
		group: {
			lessonTypes: typeof lessonTypesFilters
			teachers: typeof teachersFilters
			auditoriums: typeof auditoriumsFilters
			subjects: typeof subjectsFilters
		}
		teacher: {
			lessonTypes: typeof lessonTypesFilters
			groups: typeof groupsFilters
			auditoriums: typeof auditoriumsFilters
			subjects: typeof subjectsFilters
		}
		auditorium: {
			lessonTypes: typeof lessonTypesFilters
			teachers: typeof teachersFilters
			groups: typeof groupsFilters
			subjects: typeof subjectsFilters
		}
	}

	function filtersForType<T extends keyof FiltersForType>(type: T): FiltersForType[T]
	function filtersForType(type: keyof FiltersForType) {
		switch (type) {
			case "group":
				return {
					lessonTypes: lessonTypesFilters,
					teachers: teachersFilters,
					auditoriums: auditoriumsFilters,
					subjects: subjectsFilters,
				}
			case "teacher":
				return {
					lessonTypes: lessonTypesFilters,
					groups: groupsFilters,
					auditoriums: auditoriumsFilters,
					subjects: subjectsFilters,
				}
			case "auditorium":
				return {
					lessonTypes: lessonTypesFilters,
					teachers: teachersFilters,
					groups: groupsFilters,
					subjects: subjectsFilters,
				}
		}
	}

	return {
		lessonTypesFilters,
		teachersFilters,
		auditoriumsFilters,
		subjectsFilters,
		groupsFilters,
		activeFilters,
		hasActive,
		activeCount,
		loadFilters,
		saveFilters,
		toggle,
		isActive,
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
		filtersForType,
		clearAll,
	}
})
