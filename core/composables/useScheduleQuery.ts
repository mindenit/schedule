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

	const queryOptions = computed(() => {
		if (!selectedSchedule.value || !id.value || !startTimestamp.value || !endTimestamp.value) {
			return null
		}

		const { type } = selectedSchedule.value
		const scheduleId = id.value

		filtersStore.loadFilters(scheduleId, type)

		const options = {
			id: computed(() => scheduleId as string | number),
			startTimestamp: computed(() => startTimestamp.value as string | number),
			endTimestamp: computed(() => endTimestamp.value as string | number),
		}

		const filters = {
			lessonTypes: computed(() => activeFilters.value as string[]),
		}

		switch (type) {
			case "group":
				return groupScheduleOptions(
					options.id,
					options.startTimestamp,
					options.endTimestamp,
					filters
				)
			case "teacher":
				return teacherScheduleOptions(
					options.id,
					options.startTimestamp,
					options.endTimestamp,
					filters
				)
			case "auditorium":
				return auditoriumScheduleOptions(
					options.id,
					options.startTimestamp,
					options.endTimestamp,
					filters
				)
			default:
				return null
		}
	})

	const isEnabled = computed(() => {
		return (
			!!selectedSchedule.value &&
			!!id.value &&
			!!startTimestamp.value &&
			!!endTimestamp.value &&
			!!queryOptions.value
		)
	})

	const query = useQuery(
		computed(() => {
			if (!isEnabled.value || !queryOptions.value) {
				return {
					queryKey: ["disabled-schedule"],
					queryFn: () => Promise.resolve([]),
					enabled: false,
				}
			}

			const originalOptions = queryOptions.value
			return {
				...originalOptions,
				queryKey: [...originalOptions.queryKey, version.value],
				enabled: true,
			}
		})
	)

	return {
		...query,
		isEnabled,
	}
}
