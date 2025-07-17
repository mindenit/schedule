<script setup lang="ts">
import type { Schedule } from "nurekit"
import { storeToRefs } from "pinia"

interface Props {
	events: Schedule[]
}

const props = defineProps<Props>()

const calendarStore = useCalendarStore()
const { selectedDate } = storeToRefs(calendarStore)

const { getCalendarCells, getWeekDays } = useCalendarCells()
const { calculateEventPositions } = useEventGrouping()

const cells = computed(() => getCalendarCells(selectedDate.value))
const weekDays = computed(() => getWeekDays(selectedDate.value))
const eventPositions = computed(() => calculateEventPositions(props.events, selectedDate.value))

const weeksCount = computed(() => Math.ceil(cells.value.length / 7))
</script>

<template>
	<div class="flex h-full flex-col">
		<div class="mb-1 grid flex-shrink-0 grid-cols-7 gap-1">
			<div
				v-for="day in weekDays"
				:key="day"
				class="bg-muted/50 text-muted-foreground flex items-center justify-center py-2 text-xs font-medium
					md:first:rounded-tl-2xl md:last:rounded-tr-2xl"
			>
				{{ day }}
			</div>
		</div>

		<div
			class="grid min-h-0 flex-1 grid-cols-7 gap-1 overflow-hidden rounded-b-2xl"
			:style="`grid-template-rows: repeat(${weeksCount}, 1fr)`"
		>
			<BigCalendarDayCell
				v-for="(cell, index) in cells"
				:key="index"
				:cell="cell"
				:events="events"
				:event-positions="eventPositions"
				class="min-h-0"
			/>
		</div>
	</div>
</template>
