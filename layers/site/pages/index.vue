<script setup lang="ts">
import { storeToRefs } from "pinia"
import { useScheduleQuery } from "~/core/composables/useScheduleQuery"

const calendarStore = useCalendarStore()
const scheduleStore = useScheduleStore()

const { filteredEvents, selectedDate, view } = storeToRefs(calendarStore)
const { selectedSchedule } = storeToRefs(scheduleStore)

const hasActiveSchedule = computed(() => !!selectedSchedule.value)
const scheduleId = computed(() => selectedSchedule.value?.id)

const dateRange = computed(() => getCalendarGridRange(selectedDate.value, view.value))

const startTimestamp = computed(() => {
	if (!hasActiveSchedule.value) return undefined
	return Math.floor(dateRange.value.start.getTime() / 1000)
})

const endTimestamp = computed(() => {
	if (!hasActiveSchedule.value) return undefined
	return Math.floor(dateRange.value.end.getTime() / 1000)
})

const {
	data: scheduleData,
	error,
	isLoading,
	refetch,
} = useScheduleQuery(scheduleId, startTimestamp, endTimestamp)

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
