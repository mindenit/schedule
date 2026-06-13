<script setup lang="ts">
import type { CalendarDay } from "v-calendar/dist/types/src/utils/page"

const calendarStore = useCalendarStore()

const onDayClick = (day: CalendarDay) => {
	calendarStore.setView("day")
	calendarStore.setSelectedDate(day.date)
}

const selectedAttributes = computed(() => [
	{
		key: "selected",
		highlight: { color: "purple", fillMode: "solid" },
		dates: calendarStore.selectedDate,
	},
])

const initialPage = computed(() => ({
	month: calendarStore.selectedDate.getMonth() + 1,
	year: calendarStore.selectedDate.getFullYear(),
}))
</script>

<template>
	<UiCalendar
		expanded
		locale="uk"
		class="sidebar-calendar bg-card rounded-md"
		:attributes="selectedAttributes"
		:initial-page="initialPage"
		@dayclick="onDayClick"
	/>
</template>

<style>
.sidebar-calendar.vc-container {
	width: 100% !important;
}
</style>
