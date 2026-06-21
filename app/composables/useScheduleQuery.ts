import { useQuery } from "@tanstack/vue-query"
import { storeToRefs } from "pinia"
import { groupScheduleOptions } from "~/queries/groups"
import { teacherScheduleOptions } from "~/queries/teachers"
import { auditoriumScheduleOptions } from "~/queries/auditoriums"

export const useScheduleQuery = (
	id: Ref<number | undefined>,
	startTimestamp: Ref<number | undefined>,
	endTimestamp: Ref<number | undefined>
) => {
	const scheduleStore = useScheduleStore()
	const filtersStore = useFiltersStore()
	const { selectedSchedule } = storeToRefs(scheduleStore)

	// Reference raw filter arrays directly — no spread, no intermediate computed.
	// TanStack Query hashes keys with deep equality so reference identity doesn't matter
	// for cache lookup; only content does. Each toggle still produces a new unique key
	// because the array contents change, triggering a refetch as intended.
	const {
		lessonTypesFilters,
		teachersFilters,
		auditoriumsFilters,
		subjectsFilters,
		groupsFilters,
		version,
	} = storeToRefs(filtersStore)

	// Load per-schedule filters when the active schedule changes.
	// Side-effect must not live inside a computed — watchers are the correct place.
	watch(
		[selectedSchedule, id],
		([schedule, scheduleId]) => {
			if (schedule && scheduleId) {
				filtersStore.loadFilters(scheduleId, schedule.type)
			}
		},
		{ immediate: true }
	)

	const queryOptions = computed(() => {
		if (!selectedSchedule.value || !id.value || !startTimestamp.value || !endTimestamp.value) {
			return null
		}

		const { type } = selectedSchedule.value
		const scheduleId = id.value
		const baseParams = [scheduleId, startTimestamp.value, endTimestamp.value] as const

		const filterOptions = {
			group: {
				lessonTypes: lessonTypesFilters,
				teachers: teachersFilters,
				auditoriums: auditoriumsFilters,
				subjects: subjectsFilters,
			},
			teacher: {
				lessonTypes: lessonTypesFilters,
				groups: groupsFilters,
				auditoriums: auditoriumsFilters,
				subjects: subjectsFilters,
			},
			auditorium: {
				lessonTypes: lessonTypesFilters,
				teachers: teachersFilters,
				groups: groupsFilters,
				subjects: subjectsFilters,
			},
		}

		const queryMap = {
			group: () => groupScheduleOptions(...baseParams, filterOptions.group),
			teacher: () => teacherScheduleOptions(...baseParams, filterOptions.teacher),
			auditorium: () => auditoriumScheduleOptions(...baseParams, filterOptions.auditorium),
		}

		return queryMap[type]?.() || null
	})

	const isEnabled = computed(
		() =>
			!!(
				selectedSchedule.value &&
				id.value &&
				startTimestamp.value &&
				endTimestamp.value &&
				queryOptions.value
			)
	)

	const query = useQuery(
		computed(() => {
			if (!isEnabled.value || !queryOptions.value) {
				return {
					queryKey: ["disabled-schedule"],
					queryFn: () => Promise.resolve([]),
					enabled: false,
				}
			}
			return {
				...queryOptions.value,
				queryKey: [...queryOptions.value.queryKey, version.value],
				enabled: true,
			}
		})
	)

	return { ...query, isEnabled }
}
