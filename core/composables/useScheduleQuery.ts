import { useQuery } from "@tanstack/vue-query"
import { storeToRefs } from "pinia"
import { groupScheduleOptions } from "~/core/queries/groups"
import { teacherScheduleOptions } from "~/core/queries/teachers"
import { auditoriumScheduleOptions } from "~/core/queries/auditoriums"

export const useScheduleQuery = (
	id: Ref<number | undefined>,
	startTimestamp: Ref<number | undefined>,
	endTimestamp: Ref<number | undefined>
) => {
	const scheduleStore = useScheduleStore()
	const filtersStore = useFiltersStore()
	const { selectedSchedule } = storeToRefs(scheduleStore)
	const { version, activeFilters } = storeToRefs(filtersStore)

	const lessonTypesFilter = computed(() =>
		activeFilters.value.lessonTypes.length > 0 ? [...activeFilters.value.lessonTypes] : []
	)

	const teachersFilter = computed(() =>
		activeFilters.value.teachers.length > 0 ? [...activeFilters.value.teachers] : []
	)

	const auditoriumsFilter = computed(() =>
		activeFilters.value.auditoriums.length > 0 ? [...activeFilters.value.auditoriums] : []
	)

	const subjectsFilter = computed(() =>
		activeFilters.value.subjects.length > 0 ? [...activeFilters.value.subjects] : []
	)

	const groupsFilter = computed(() =>
		activeFilters.value.groups.length > 0 ? [...activeFilters.value.groups] : []
	)

	const queryOptions = computed(() => {
		if (!selectedSchedule.value || !id.value || !startTimestamp.value || !endTimestamp.value) {
			return null
		}

		const { type } = selectedSchedule.value
		const scheduleId = id.value

		filtersStore.loadFilters(scheduleId, type)

		const baseParams = [scheduleId, startTimestamp.value, endTimestamp.value] as const

		const filterOptions = {
			group: {
				lessonTypes: lessonTypesFilter,
				teachers: teachersFilter,
				auditoriums: auditoriumsFilter,
				subjects: subjectsFilter,
			},
			teacher: {
				lessonTypes: lessonTypesFilter,
				groups: groupsFilter,
				auditoriums: auditoriumsFilter,
				subjects: subjectsFilter,
			},
			auditorium: {
				lessonTypes: lessonTypesFilter,
				teachers: teachersFilter,
				groups: groupsFilter,
				subjects: subjectsFilter,
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

	return {
		...query,
		isEnabled,
	}
}
