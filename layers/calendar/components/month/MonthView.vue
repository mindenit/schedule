<script setup lang="ts">
import { storeToRefs } from "pinia"

interface Props {
	events: ICalendarEvent[]
}

const props = defineProps<Props>()

const calendarStore = useCalendarStore()
const { selectedDate } = storeToRefs(calendarStore)

const { getCalendarCells, getWeekDays } = useCalendarCells()
const { calculateEventPositions } = useEventGrouping()

const cells = computed(() => getCalendarCells(selectedDate.value))
const weekDays = computed(() => getWeekDays(selectedDate.value))
const eventPositions = computed(() => calculateEventPositions(props.events, selectedDate.value))
</script>

<template>
	<div class="w-full">
		<div class="mb-1 grid grid-cols-7 gap-1">
			<div
				v-for="day in weekDays"
				:key="day"
				class="bg-muted/50 text-muted-foreground flex items-center justify-center py-2 text-xs font-medium
					first:rounded-tl-2xl last:rounded-tr-2xl"
			>
				{{ day }}
			</div>
		</div>
		<div class="grid grid-cols-7 gap-1 overflow-hidden rounded-b-2xl">
			<CalendarDayCell
				v-for="(cell, index) in cells"
				:key="index"
				:cell="cell"
				:events="events"
				:event-positions="eventPositions"
			/>
		</div>
	</div>
</template>
