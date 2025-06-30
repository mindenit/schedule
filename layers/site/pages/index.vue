<script setup lang="ts">
import { useQuery } from "@tanstack/vue-query"
import { storeToRefs } from "pinia"
import { groupScheduleOptions } from "~/core/queries/groups"

const calendarStore = useCalendarStore()
const scheduleStore = useScheduleStore()

const { filteredEvents, selectedDate, view } = storeToRefs(calendarStore)
const { selectedSchedule } = storeToRefs(scheduleStore)

const hasActiveSchedule = computed(() => {
	return selectedSchedule.value && selectedSchedule.value.id
})

const queryParams = computed(() => {
	if (!hasActiveSchedule.value) return null

	const { start, end } = getCalendarGridRange(selectedDate.value, view.value)
	return {
		groupId: selectedSchedule.value!.id,
		startTimestamp: Math.floor(start.getTime() / 1000),
		endTimestamp: Math.floor(end.getTime() / 1000),
	}
})

const {
	data: scheduleData,
	error,
	isLoading,
} = useQuery({
	...groupScheduleOptions(
		computed(() => queryParams.value?.groupId || ""),
		computed(() => queryParams.value?.startTimestamp || 0),
		computed(() => queryParams.value?.endTimestamp || 0)
	),
	enabled: computed(() => !!hasActiveSchedule.value),
})

watchEffect(() => {
	if (scheduleData.value) {
		calendarStore.setEvents(scheduleData.value)
	}
})

watch(
	selectedSchedule,
	(newSchedule, oldSchedule) => {
		if (newSchedule?.id !== oldSchedule?.id) {
			calendarStore.setEvents([])
		}
	},
	{ deep: true }
)
</script>

<template>
	<div class="min-h-screen p-6">
		<div
			v-if="!hasActiveSchedule"
			class="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4"
		>
			warning will be here eventually
		</div>

		<div
			v-if="isLoading && hasActiveSchedule"
			class="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4"
		>
			<div class="flex items-center">
				<TheLoader />
			</div>
		</div>

		<div
			v-if="error && hasActiveSchedule"
			class="mb-6 rounded-lg border border-red-200 bg-red-50 p-4"
		>
			error here
		</div>

		<div class="mb-6 flex flex-wrap items-center justify-between gap-4">
			<ScheduleAddDialog />
			<CalendarDateNavigator />
			<CalendarViewSwitcher />
		</div>

		<CalendarRoot :events="filteredEvents" />
	</div>
</template>
