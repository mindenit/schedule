<script setup lang="ts">
import { computed } from "vue"
import { storeToRefs } from "pinia"
import type { ICalendarEvent } from "../types"

interface Props {
	events: ICalendarEvent[]
}

const props = defineProps<Props>()

const calendarStore = useCalendarStore()
const { selectedDate } = storeToRefs(calendarStore)

const cells = computed(() => getCalendarCells(selectedDate.value))

const eventPositions = computed(() =>
	calculateMonthEventPositions(props.events, selectedDate.value)
)
</script>

<template>
	<div class="w-full">
		<div class="grid grid-cols-7 gap-1 overflow-hidden">
			<CalendarDayCell
				v-for="(cell, index) in cells"
				:key="index"
				:cell="cell"
				:events="events"
				:event-positions="eventPositions"
				:is-first-row="index < 7"
			/>
		</div>
	</div>
</template>
