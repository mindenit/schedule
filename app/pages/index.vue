<script setup lang="ts">
import { storeToRefs } from "pinia"
import { useScheduleQuery } from "~/composables/useScheduleQuery"

const calendarStore = useCalendarStore()
const scheduleStore = useScheduleStore()
const { trackEvent } = useAnalytics()

useUrlState()

// Fire once on the very first visit when no schedules are configured.
const hasSeenFirstVisit = useLocalStorage("op-first-visit-seen", false)
onMounted(() => {
	if (!hasSeenFirstVisit.value && scheduleStore.allSchedules.length === 0) {
		hasSeenFirstVisit.value = true
		trackEvent("first_visit")
	}
})

const { filteredEvents, selectedDate } = storeToRefs(calendarStore)
const { selectedSchedule } = storeToRefs(scheduleStore)

const seoTitle = computed(() =>
	selectedSchedule.value ? `${selectedSchedule.value.name} — розклад` : SEO_DEFAULT_TITLE
)
const seoDescription = computed(() =>
	selectedSchedule.value
		? `Розклад занять для ${selectedSchedule.value.name}. Перегляд по днях, тижнях та на місяць.`
		: SEO_DEFAULT_DESCRIPTION
)

useSeo({
	title: seoTitle,
	description: seoDescription,
})

const hasActiveSchedule = computed(() => !!selectedSchedule.value)
const scheduleId = computed(() => selectedSchedule.value?.id)

const getAcademicYearRange = (date: Date) => {
	const year = date.getFullYear()
	const currentDate = new Date(date)

	if (currentDate.getMonth() < 8) {
		return {
			start: new Date(year - 1, 8, 1, 0, 0, 0, 0),
			end: new Date(year, 8, 1, 23, 59, 59, 999),
		}
	}

	return {
		start: new Date(year, 8, 1, 0, 0, 0, 0),
		end: new Date(year + 1, 8, 1, 23, 59, 59, 999),
	}
}

const dateRange = computed(() => getAcademicYearRange(selectedDate.value))

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
} = useScheduleQuery(scheduleId, startTimestamp, endTimestamp)

// Identify the active schedule by a stable string key — avoids a deep object watch.
const scheduleKey = computed(() =>
	selectedSchedule.value ? `${selectedSchedule.value.type}-${selectedSchedule.value.id}` : null
)

// Clear events when the active schedule switches to a different one.
// Guard: only fire on genuine key transitions (not the initial undefined → key
// hydration step) so the data watcher's immediate:true fill is never clobbered.
watch(scheduleKey, (newKey, oldKey) => {
	if (oldKey && newKey !== oldKey) {
		calendarStore.setEvents([])
	}
})

// immediate: true ensures the watcher fires with the current value on setup.
// Without it, if TanStack Query restores data from IndexedDB before this
// watcher is registered (cache hit, staleTime not yet exceeded), scheduleData
// is already populated but the watcher never fires — allEvents stays [] and
// no events render until the next query refetch or server restart.
watch(
	scheduleData,
	(data) => {
		if (data) calendarStore.setEvents(data)
	},
	{ immediate: true }
)
</script>

<template>
	<BigCalendarRoot
		:events="filteredEvents"
		:has-active-schedule="!!hasActiveSchedule"
		:is-loading="isLoading"
		:error="error"
		:schedule-name="selectedSchedule?.name"
	/>
</template>
