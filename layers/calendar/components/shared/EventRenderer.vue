<script setup lang="ts">
import { areIntervalsOverlapping } from "date-fns"

interface Props {
	groupedEvents: ICalendarEvent[][]
	day: Date
}

const props = defineProps<Props>()

const { getEventBlockStyle } = useEventGrouping()

const renderEvents = computed(() => {
	return props.groupedEvents.flatMap((group, groupIndex) =>
		group.map((event) => {
			let style = getEventBlockStyle(event, props.day, groupIndex, props.groupedEvents.length)

			const hasOverlap = props.groupedEvents.some(
				(otherGroup, otherIndex) =>
					otherIndex !== groupIndex &&
					otherGroup.some((otherEvent) =>
						areIntervalsOverlapping(
							{
								start: new Date(event.startedAt),
								end: new Date(event.endedAt),
							},
							{
								start: new Date(otherEvent.startedAt),
								end: new Date(otherEvent.endedAt),
							}
						)
					)
			)

			if (!hasOverlap) {
				style = { ...style, width: "100%", left: "0%" }
			}

			return {
				event,
				style,
				key: `${event.id}-${groupIndex}`,
			}
		})
	)
})
</script>

<template>
	<div v-for="{ event, style, key } in renderEvents" :key="key" class="absolute p-1" :style="style">
		<CalendarEventBlock :event="event" />
	</div>
</template>
