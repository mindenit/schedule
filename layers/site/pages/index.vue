<script setup lang="ts">
import { storeToRefs } from "pinia"

const calendarStore = useCalendarStore()
const { filteredEvents } = storeToRefs(calendarStore)

const yearlyEvents = generateYearlyMockSchedule()
const allEvents = computed(() => filteredEvents.value)

onMounted(() => {
	calendarStore.setEvents(yearlyEvents)
})
</script>

<template>
	<div class="min-h-screen p-6">
		<div class="mb-6 flex flex-wrap items-center justify-between gap-4">
			<CalendarDateNavigator />
			<CalendarViewSwitcher />
		</div>
		<CalendarRoot :events="allEvents" />
	</div>
</template>
