<script setup lang="ts">
import { areIntervalsOverlapping } from "date-fns"
import type { Schedule } from "nurekit"

interface Props {
	groupedEvents: Schedule[][]
	day: Date | string | number
}

const props = defineProps<Props>()

const { getEventBlockStyle, parseDate } = useEventGrouping()

const renderEvents = computed(() => {
	const dayDate = parseDate(props.day)

	return props.groupedEvents.flatMap((group, groupIndex) =>
		group.map((event) => {
			let style = getEventBlockStyle(event, dayDate, groupIndex, props.groupedEvents.length)

			const hasOverlap = props.groupedEvents.some(
				(otherGroup, otherIndex) =>
					otherIndex !== groupIndex &&
					otherGroup.some((otherEvent) =>
						areIntervalsOverlapping(
							{
								start: parseDate(event.startedAt),
								end: parseDate(event.endedAt),
							},
							{
								start: parseDate(otherEvent.startedAt),
								end: parseDate(otherEvent.endedAt),
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
	<div
		v-for="{ event, style, key } in renderEvents"
		:key="key"
		class="absolute px-1"
		:style="style"
	>
		<CalendarEventBlock :event="event" />
	</div>
</template>
