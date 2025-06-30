<script setup lang="ts">
import { useQuery } from "@tanstack/vue-query"
import { storeToRefs } from "pinia"
import { auditoriumScheduleOptions } from "~/core/queries/auditoriums"
import { groupScheduleOptions } from "~/core/queries/groups"
import { teacherScheduleOptions } from "~/core/queries/teachers"

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
			<div class="flex items-center gap-1">
				<ScheduleAddDialog />
				<ScheduleSelect />
			</div>
			<CalendarDateNavigator />
			<CalendarViewSwitcher />
		</div>

		<CalendarRoot :events="filteredEvents" />
	</div>
</template>
