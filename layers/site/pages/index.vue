<script setup lang="ts">
import { storeToRefs } from "pinia"

const calendarStore = useCalendarStore()
const { filteredEvents } = storeToRefs(calendarStore)

const yearlyEvents = generateYearlyMockEvents(2025)
const mockEvents = yearlyEvents
const allEvents = computed(() => filteredEvents.value)

onMounted(() => {
	calendarStore.setEvents(mockEvents)
})
</script>

<template>
	<div class="min-h-screen p-6">
		<div class="mb-6 flex flex-wrap items-center justify-between gap-4">
			<div class="flex items-center gap-4">
				<CalendarDateNavigator />
				<CalendarViewSwitcher />
			</div>
			<div class="text-muted-foreground flex items-center gap-2 text-sm">
				<span>Подій завантажено: {{ mockEvents.length }}</span>
			</div>
		</div>
		<CalendarRoot :events="allEvents" />
	</div>
</template>
