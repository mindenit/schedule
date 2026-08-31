import { useStorage } from "@vueuse/core"
import { skipHydrate } from "pinia"
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

const ensureArray = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : [])

const filterSerializer = {
	read: (raw: string): FilterState => {
		try {
			const parsed = JSON.parse(raw) as Partial<FilterState>
			return {
				lessonTypes: ensureArray<string>(parsed.lessonTypes),
				teachers: ensureArray<number>(parsed.teachers),
				auditoriums: ensureArray<number>(parsed.auditoriums),
				subjects: ensureArray<number>(parsed.subjects),
				groups: ensureArray<number>(parsed.groups),
			}
		} catch {
			return emptyState()
		}
	},
	write: (val: FilterState): string => JSON.stringify(val),
}

export const useFiltersStore = defineStore("filters", () => {
	// Reactive storage key — swapped by loadFilters() when the user changes schedule.
	const storageKey = ref("")

	// useStorage is re-evaluated reactively when storageKey changes.
	// skipHydrate prevents SSR/client mismatch (same pattern as other stores).
	const state = skipHydrate(
		useStorage<FilterState>(storageKey, emptyState, undefined, {
			serializer: filterSerializer,
		})
	)

	const loadFilters = (scheduleId: string | number, scheduleType: string) => {
		const key = STORAGE_KEYS.filters(scheduleType, scheduleId)
		if (key === storageKey.value) return
		storageKey.value = key
	}

	const toggle = <K extends FilterKey>(key: K, value: FilterValue<K>) => {
		const arr = state.value[key] as FilterValue<K>[]
		const index = arr.indexOf(value)
		if (index > -1) arr.splice(index, 1)
		else arr.push(value)
	}

	const isActive = <K extends FilterKey>(key: K, value: FilterValue<K>) => {
		return (state.value[key] as FilterValue<K>[]).includes(value)
	}

	const clearAll = () => {
		state.value = emptyState()
	}

	// Per-type computed refs for reactive reads in templates and queries.
	const lessonTypesFilters = computed(() => state.value.lessonTypes)
	const teachersFilters = computed(() => state.value.teachers)
	const auditoriumsFilters = computed(() => state.value.auditoriums)
	const subjectsFilters = computed(() => state.value.subjects)
	const groupsFilters = computed(() => state.value.groups)

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
		toggle,
		isActive,
		filtersForType,
		clearAll,
	}
})
