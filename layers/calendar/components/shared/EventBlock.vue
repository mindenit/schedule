<script setup lang="ts">
import { differenceInMinutes } from "date-fns"
import type { Schedule } from "nurekit"

interface Props {
	event: Schedule
	class?: string
}

const props = defineProps<Props>()

const { formatTimeRange, getEventTypeColor } = useEventFormatting()

const start = computed(() => parseDate(props.event.startedAt))
const end = computed(() => parseDate(props.event.endedAt))
const durationInMinutes = computed(() => {
	const startDate = start.value
	const endDate = end.value
	return startDate && endDate ? differenceInMinutes(endDate, startDate) : 0
})
const heightInPixels = computed(() => (durationInMinutes.value / 60) * WEEK_VIEW_ROW_HEIGHT - 8)

const blockClasses = computed(() => [
	"flex flex-col gap-0.5 items-center justify-center select-none rounded-md px-2 text-xs focus-visible:outline-offset-2 transition-all duration-200 cursor-pointer overflow-hidden min-w-0",
	getEventTypeColor(props.event.type),
	props.class,
])

const formattedTimeRange = computed(() => formatTimeRange(props.event))
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
				<p class="w-full truncate text-center font-semibold">{{ event.subject.title }}</p>
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
