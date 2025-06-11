<script setup lang="ts">
import { computed } from "vue"
import { storeToRefs } from "pinia"
import type { ICalendarEvent, TEventType } from "../types"

interface Props {
	event: ICalendarEvent
	class?: string
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

const badgeClasses = computed(() => [
	"group flex w-full h-6.5 select-none items-center gap-1 rounded-md px-2 text-xs font-medium cursor-pointer transition-all duration-200 hover:shadow-sm",
	typeColorMap[props.event.type],
	props.class,
])

const formattedTime = computed(
	() =>
		`${formatTime(new Date(props.event.startDate), use24HourFormat.value)} - ${formatTime(new Date(props.event.endDate), use24HourFormat.value)}`
)

function handleClick() {
	console.log("Event clicked:", props.event)
}
</script>

<template>
	<div
		role="button"
		tabindex="0"
		:class="badgeClasses"
		@click="handleClick"
		@keydown.enter="handleClick"
		@keydown.space.prevent="handleClick"
	>
		<span class="flex-1 shrink-0 truncate">
			{{ event.title }}
		</span>
		<span class="shrink-0 truncate group-[.hide-time]:hidden">{{ formattedTime }}</span>
	</div>
</template>
