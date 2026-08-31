<script setup lang="ts">
import { skipHydrate, storeToRefs } from "pinia"
import { useScheduleQuery } from "~/composables/useScheduleQuery"

const calendarStore = useCalendarStore()
const scheduleStore = useScheduleStore()
const { trackEvent } = useAnalytics()

useUrlState()

// Fire once on the very first visit when no schedules are configured.
// skipHydrate prevents SSR/client mismatch (matches pattern in other stores/pages).
const hasSeenFirstVisit = skipHydrate(useLocalStorage(STORAGE_KEYS.firstVisitSeen, false))
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
	// Academic year: Sept 1 → Sept 1. Pad ±7 days so month/week grid cells
	// that overhang the boundary (up to 6 days in either direction) still have
	// events fetched. Without the pad, September cells in August's grid and
	// August cells in September's grid render empty.
	const startYear = date.getMonth() < 8 ? date.getFullYear() - 1 : date.getFullYear()
	return {
		start: new Date(startYear, 8, 1 - 7, 0, 0, 0, 0),
		end: new Date(startYear + 1, 8, 1 + 7, 23, 59, 59, 999),
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
	// dataUpdatedAt — Unix ms of the last successful fetch; 0 when never fetched.
	// Comes from TanStack Query directly; no extra work needed.
	dataUpdatedAt,
	// fetchStatus: "fetching" | "paused" | "idle"
	// status: "pending" | "error" | "success"
	// "paused" + "pending" = network offline, query never resolved yet.
	fetchStatus,
	status,
} = useScheduleQuery(scheduleId, startTimestamp, endTimestamp)

// Offline AND no cached data yet (TanStack v5 networkMode: "online" default:
// the query pauses instead of erroring when connectivity is absent).
// Must be a separate computed so Root.vue can pick the right overlay branch.
const isOfflineNoData = computed(() => fetchStatus.value === "paused" && status.value === "pending")

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
	[scheduleData, dataUpdatedAt],
	([data, updatedAt]) => {
		if (data) calendarStore.setEvents(data, updatedAt)
	},
	{ immediate: true }
)
</script>

<template>
	<BigCalendarRoot
		:events="filteredEvents"
		:has-active-schedule="!!hasActiveSchedule"
		:is-loading="isLoading"
		:is-offline-no-data="isOfflineNoData"
		:error="error"
		:schedule-name="selectedSchedule?.name"
	/>
</template>
