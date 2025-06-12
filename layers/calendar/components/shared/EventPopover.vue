<script setup lang="ts">
import { computed } from "vue"
import { format } from "date-fns"
import { uk } from "date-fns/locale"
import { storeToRefs } from "pinia"
import type { ICalendarEvent, TEventType } from "../types"

interface Props {
	event: ICalendarEvent
}

const props = defineProps<Props>()

const calendarStore = useCalendarStore()
const { use24HourFormat } = storeToRefs(calendarStore)

const typeColorMap: Record<TEventType, string> = {
	practise: "bg-event-practise",
	lecture: "bg-event-lecture",
	lab: "bg-event-lab",
	consultation: "bg-event-consultation",
	exam: "bg-event-exam",
	credit: "bg-event-credit",
}

const eventTypeLabels: Record<TEventType, string> = {
	practise: "Практичне заняття",
	lecture: "Лекція",
	lab: "Лабораторна робота",
	consultation: "Консультація",
	exam: "Екзамен",
	credit: "Залік",
}

const eventTypeLabel = computed(() => eventTypeLabels[props.event.type])

const formattedTimeRange = computed(() => {
	const start = new Date(props.event.startDate)
	const end = new Date(props.event.endDate)
	return `${formatTime(start, use24HourFormat.value)} - ${formatTime(end, use24HourFormat.value)}`
})

const formattedDate = computed(() => {
	const date = new Date(props.event.startDate)
	return format(date, "d MMMM yyyy", { locale: uk })
})
</script>

<template>
	<div class="space-y-4">
		<div class="flex items-start gap-3">
			<div class="mt-1.5 h-3 w-3 flex-shrink-0 rounded-full" :class="typeColorMap[event.type]" />
			<div class="min-w-0 flex-1">
				<h3 class="text-base leading-tight font-semibold">
					{{ event.title }}
				</h3>
				<p class="text-muted-foreground mt-1 text-sm">
					{{ eventTypeLabel }}
				</p>
			</div>
		</div>

		<div class="flex items-center gap-3 text-sm">
			<Icon name="lucide:clock" class="text-muted-foreground h-4 w-4" />
			<span>{{ formattedTimeRange }}</span>
		</div>

		<div class="flex items-center gap-3 text-sm">
			<Icon name="lucide:calendar" class="text-muted-foreground h-4 w-4" />
			<span>{{ formattedDate }}</span>
		</div>

		<div v-if="event.location" class="flex items-center gap-3 text-sm">
			<Icon name="lucide:map-pin" class="text-muted-foreground h-4 w-4" />
			<span>{{ event.location }}</span>
		</div>

		<div v-if="event.teacher" class="flex items-center gap-3 text-sm">
			<Icon name="lucide:user" class="text-muted-foreground h-4 w-4" />
			<span>{{ event.teacher }}</span>
		</div>
	</div>
</template>
