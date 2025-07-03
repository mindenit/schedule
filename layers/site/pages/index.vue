<script setup lang="ts">
import { useQuery } from "@tanstack/vue-query"
import { storeToRefs } from "pinia"
import { groupScheduleOptions } from "~/core/queries/groups"
import { teacherScheduleOptions } from "~/core/queries/teachers"
import { auditoriumScheduleOptions } from "~/core/queries/auditoriums"

const calendarStore = useCalendarStore()
const scheduleStore = useScheduleStore()

const { filteredEvents, selectedDate, view } = storeToRefs(calendarStore)
const { selectedSchedule } = storeToRefs(scheduleStore)

const hasActiveSchedule = computed(() => {
	return selectedSchedule.value && selectedSchedule.value.id && selectedSchedule.value.type
})

const queryParams = computed(() => {
	if (!hasActiveSchedule.value) return null

	const { start, end } = getCalendarGridRange(selectedDate.value, view.value)
	return {
		id: selectedSchedule.value!.id,
		type: selectedSchedule.value!.type,
		startTimestamp: Math.floor(start.getTime() / 1000),
		endTimestamp: Math.floor(end.getTime() / 1000),
	}
})

const createQueryOptions = () => {
	if (!queryParams.value) return null

	const { id, type, startTimestamp, endTimestamp } = queryParams.value

	switch (type) {
		case "group":
			return groupScheduleOptions(
				computed(() => id),
				computed(() => startTimestamp),
				computed(() => endTimestamp)
			)
		case "teacher":
			return teacherScheduleOptions(
				computed(() => id),
				computed(() => startTimestamp),
				computed(() => endTimestamp)
			)
		case "auditorium":
			return auditoriumScheduleOptions(
				computed(() => id),
				computed(() => startTimestamp),
				computed(() => endTimestamp)
			)
	}
}

const queryOptions = computed(() => createQueryOptions())

const {
	data: scheduleData,
	error,
	isLoading,
	refetch,
} = useQuery(
	computed(() => {
		const options = queryOptions.value
		if (!options || !hasActiveSchedule.value) {
			return {
				queryKey: ["disabled"],
				queryFn: () => Promise.resolve([]),
				enabled: false,
			}
		}

		return {
			...options,
			enabled: true,
		}
	})
)

watchEffect(() => {
	if (scheduleData.value) {
		calendarStore.setEvents(scheduleData.value)
	}
})

watch(
	selectedSchedule,
	(newSchedule, oldSchedule) => {
		const newKey = newSchedule ? `${newSchedule.type}-${newSchedule.id}` : null
		const oldKey = oldSchedule ? `${oldSchedule.type}-${oldSchedule.id}` : null

		if (newKey !== oldKey) {
			calendarStore.setEvents([])
		}
	},
	{ deep: true }
)
</script>

<template>
	<BigCalendarRoot
		:events="filteredEvents"
		:has-active-schedule="!!hasActiveSchedule"
		:is-loading="isLoading"
		:error="error"
		:schedule-name="selectedSchedule?.name"
		@refetch="refetch"
	/>
</template>
