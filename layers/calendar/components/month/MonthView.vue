<script setup lang="ts">
import { computed } from "vue"
import { storeToRefs } from "pinia"
import {
	addDays,
	eachDayOfInterval,
	endOfMonth,
	endOfWeek,
	format,
	parseISO,
	startOfDay,
	startOfMonth,
	startOfWeek,
} from "date-fns"
import { uk } from "date-fns/locale"

interface Props {
	events: ICalendarEvent[]
}

const props = defineProps<Props>()

const calendarStore = useCalendarStore()
const { selectedDate } = storeToRefs(calendarStore)

const cells = computed(() => getCalendarCells(selectedDate.value))

const eventPositions = computed(() => {
	const monthStart = startOfMonth(selectedDate.value)
	const monthEnd = endOfMonth(selectedDate.value)
	const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
	const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })

	const positions: Record<string, number> = {}
	const occupiedPositions: Record<string, boolean[]> = {}

	eachDayOfInterval({ start: calendarStart, end: calendarEnd }).forEach((day) => {
		occupiedPositions[day.toISOString()] = [false, false, false]
	})

	const sortedEvents = [...props.events].sort(
		(a, b) => parseISO(a.startDate).getTime() - parseISO(b.startDate).getTime()
	)

	sortedEvents.forEach((event) => {
		const eventDate = startOfDay(parseISO(event.startDate))

		if (eventDate >= calendarStart && eventDate <= calendarEnd) {
			const dayKey = eventDate.toISOString()
			const dayPositions = occupiedPositions[dayKey]

			if (dayPositions) {
				let position = -1
				for (let i = 0; i < 3; i++) {
					if (!dayPositions[i]) {
						position = i
						break
					}
				}

				if (position !== -1) {
					dayPositions[position] = true
					positions[String(event.id)] = position
				}
			}
		}
	})

	return positions
})

const weekDays = computed(() => {
	const weekStart = startOfWeek(selectedDate.value, { weekStartsOn: 1 })
	return Array.from({ length: 7 }, (_, i) => {
		const day = addDays(weekStart, i)
		const dayName = format(day, "E", { locale: uk })
		return dayName.charAt(0).toUpperCase() + dayName.slice(1)
	})
})
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
