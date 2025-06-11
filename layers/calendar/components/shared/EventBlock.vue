<script setup lang="ts">
import { computed } from "vue"
import { storeToRefs } from "pinia"
import { differenceInMinutes, parseISO } from "date-fns"

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

const start = computed(() => parseISO(props.event.startDate))
const end = computed(() => parseISO(props.event.endDate))
const durationInMinutes = computed(() => differenceInMinutes(end.value, start.value))
const heightInPixels = computed(() => (durationInMinutes.value / 60) * WEEK_VIEW_ROW_HEIGHT - 8)

const isShortEvent = computed(() => durationInMinutes.value < 35)
const showTime = computed(() => durationInMinutes.value > 25)

const blockClasses = computed(() => [
	"flex select-none truncate whitespace-nowrap rounded-md border px-2 text-xs focus-visible:outline-offset-2 transition-all duration-200 cursor-pointer",
	isShortEvent.value ? "py-0 justify-center items-center" : "flex-col gap-0.5 py-1.5",
	typeColorMap[props.event.type] || "border-gray-200 bg-gray-100/50 text-gray-700",
	props.class,
])

const formattedTimeRange = computed(
	() =>
		`${formatTime(start.value, use24HourFormat.value)} - ${formatTime(end.value, use24HourFormat.value)}`
)

function handleClick() {
	console.log("Event clicked:", props.event)
}
</script>

<template>
	<div
		role="button"
		tabindex="0"
		:class="blockClasses"
		:style="{ height: `${heightInPixels}px` }"
		@click="handleClick"
		@keydown.enter="handleClick"
		@keydown.space.prevent="handleClick"
	>
		<div class="flex items-center gap-1.5 truncate">
			<p class="truncate font-semibold">{{ event.title }}</p>
		</div>

		<p v-if="showTime">
			{{ formattedTimeRange }}
		</p>
	</div>
</template>
