<script setup lang="ts">
import { areIntervalsOverlapping } from "date-fns"
import type { Schedule } from "nurekit"

interface Props {
	groupedEvents: Schedule[][]
	day: Date | string | number
	tz: string
	/** Forwarded to each EventBlock — false disables Popover/click during animation. */
	interactive?: boolean
}

const props = withDefaults(defineProps<Props>(), { interactive: true })

/**
 * Returns the indices of all groups that have at least one event overlapping
 * the given event's time interval.
 *
 * This gives each event its LOCAL concurrent-column count (how many columns
 * are actually in use AT THIS EVENT'S TIME SLOT), rather than the global
 * groups.length which includes columns that only overlap at other time slots.
 *
 * Example: 5 events — A(07:45-09:20), B(09:30-11:05), C(11:15-12:50),
 * D(13:10-14:45), then E/F/G all at (14:55-16:30).
 * groupEvents() produces 3 groups: [A,C,E], [B,D,F], [G].
 * With global groups.length=3, A would incorrectly get width=33%.
 * With this function, A only overlaps group 0 → localGroupCount=1 → width=100%.
 * E overlaps groups 0,1,2 → localGroupCount=3 → width=33%. ✓
 */
function getConcurrentGroupIndices(event: Schedule, groups: Schedule[][]): number[] {
	const eventInterval = { start: event.startedAt * 1000, end: event.endedAt * 1000 }
	const concurrent: number[] = []
	for (let j = 0; j < groups.length; j++) {
		const overlapsGroup = groups[j]!.some((other) =>
			areIntervalsOverlapping(eventInterval, {
				start: other.startedAt * 1000,
				end: other.endedAt * 1000,
			})
		)
		if (overlapsGroup) concurrent.push(j)
	}
	return concurrent
}

const renderEvents = computed(() => {
	const dayDate = parseDate(props.day)
	const groups = props.groupedEvents

	return groups.flatMap((group, groupIndex) =>
		group.map((event) => {
			const concurrent = getConcurrentGroupIndices(event, groups)
			const localGroupCount = concurrent.length
			const localGroupIndex = concurrent.indexOf(groupIndex)
			const style = getEventBlockStyle(event, dayDate, localGroupIndex, localGroupCount, props.tz)
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
		<BigCalendarEventBlock :event="event" :interactive="props.interactive" />
	</div>
</template>
