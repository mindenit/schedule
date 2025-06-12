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

const blockClasses = computed(() => [
	"flex flex-col gap-0.5 items-center justify-center select-none rounded-md px-2 text-xs focus-visible:outline-offset-2 transition-all duration-200 cursor-pointer overflow-hidden min-w-0",
	typeColorMap[props.event.type] || "border-gray-200 bg-gray-100/50 text-gray-700",
	props.class,
])

const formattedTimeRange = computed(
	() =>
		`${formatTime(start.value, use24HourFormat.value)} - ${formatTime(end.value, use24HourFormat.value)}`
)
</script>

<template>
	<Popover>
		<PopoverTrigger as-child>
			<div
				role="button"
				tabindex="0"
				:class="blockClasses"
				:style="{ height: `${heightInPixels}px` }"
			>
				<p class="w-full truncate text-center font-semibold">{{ event.title }}</p>
				<p class="w-full truncate text-center">
					{{ formattedTimeRange }}
				</p>
			</div>
		</PopoverTrigger>
		<PopoverContent class="w-80">
			<CalendarEventPopover :event />
		</PopoverContent>
	</Popover>
</template>
