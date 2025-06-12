<script setup lang="ts">
import { storeToRefs } from "pinia"

interface Props {
	events: ICalendarEvent[]
}

const props = defineProps<Props>()

const calendarStore = useCalendarStore()
const { view } = storeToRefs(calendarStore)
</script>

<template>
	<div class="overflow-hidden rounded-lg">
		<CalendarMonthView v-if="view === 'month'" :events="props.events" />
		<CalendarWeekView v-else-if="view === 'week'" :events="props.events" />
		<CalendarDayView v-else-if="view === 'day'" :events="props.events" />
	</div>
</template>
