<script lang="ts" setup>
import { getLocalTimeZone, today, type DateValue } from "@internationalized/date"
import { useQuery } from "@tanstack/vue-query"
import { storeToRefs } from "pinia"
import type { Schedule } from "nurekit"
import { groupScheduleOptions } from "../queries/groups"
import { teacherScheduleOptions } from "../queries/teachers"
import { auditoriumScheduleOptions } from "../queries/auditoriums"

const isDevMode = computed(() => import.meta.env.DEV)
const value = ref(today(getLocalTimeZone())) as Ref<DateValue>

const scheduleStore = useScheduleStore()
const { selectedSchedule } = storeToRefs(scheduleStore)

const formattedDate = computed(() => {
	const jsDate = value.value.toDate(getLocalTimeZone())
	const options: Intl.DateTimeFormatOptions = {
		weekday: "long",
		day: "numeric",
		month: "long",
	}
	const dateString = new Intl.DateTimeFormat("uk-UA", options).format(jsDate)
	return dateString.charAt(0).toUpperCase() + dateString.slice(1)
})

const todayEvents = ref<Schedule[]>([])

const hasActiveSchedule = computed(() => {
	return selectedSchedule.value && selectedSchedule.value.id && selectedSchedule.value.type
})

const queryParams = computed(() => {
	if (!hasActiveSchedule.value) return null

	const startOfDay = new Date(value.value.toDate(getLocalTimeZone()))
	startOfDay.setHours(0, 0, 0, 0)
	const endOfDay = new Date(startOfDay)
	endOfDay.setHours(23, 59, 59, 999)

	return {
		id: selectedSchedule.value!.id,
		type: selectedSchedule.value!.type,
		startTimestamp: Math.floor(startOfDay.getTime() / 1000),
		endTimestamp: Math.floor(endOfDay.getTime() / 1000),
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

const { data: scheduleData } = useQuery(
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

const formatTime = (date: Date | string | number): string => {
	const parsed = parseDate(date)
	return new Intl.DateTimeFormat("uk-UA", { hour: "2-digit", minute: "2-digit" }).format(parsed)
}

watchEffect(() => {
	if (scheduleData.value) {
		todayEvents.value = scheduleData.value
	}
})
</script>

<template>
	<div class="flex min-h-0 flex-1 flex-col gap-4">
		<div class="text-base font-semibold">{{ formattedDate }}</div>

		<div v-if="isDevMode" class="flex items-center gap-2">
			<Button @click="value = value.subtract({ days: 1 })">Previous Day</Button>
			<Button @click="value = value.add({ days: 1 })">Next Day</Button>
		</div>

		<div class="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto">
			<SidebarEvent
				v-for="event in todayEvents"
				:key="event.id"
				:start-time="formatTime(event.startedAt)"
				:end-time="formatTime(event.endedAt)"
				:auditorium="event.auditorium.name"
				:type="event.type as TEventType"
				:name="event.subject.title"
			/>
		</div>
	</div>
</template>
