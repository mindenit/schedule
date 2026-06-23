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
		const sid = id.value
		const start = startTimestamp.value
		const end = endTimestamp.value

		// The filters store owns the per-type whitelist of which filter keys belong to which
		// entity's API. Each branch pairs the correct factory with the correctly-shaped filters,
		// preserving exact TypeScript narrowing.
		switch (type) {
			case "group":
				return groupScheduleOptions(sid, start, end, filtersStore.filtersForType("group"))
			case "teacher":
				return teacherScheduleOptions(sid, start, end, filtersStore.filtersForType("teacher"))
			case "auditorium":
				return auditoriumScheduleOptions(
					sid,
					start,
					end,
					filtersStore.filtersForType("auditorium")
				)
			default:
				return null
		}
	})

	const isEnabled = computed(() => queryOptions.value !== null)

	const query = useQuery(
		computed(() => {
			if (!queryOptions.value) {
				return {
					queryKey: ["disabled-schedule"],
					queryFn: () => Promise.resolve([]),
					enabled: false,
				}
			}
			return { ...queryOptions.value, enabled: true }
		})
	)

	return { ...query, isEnabled }
}
