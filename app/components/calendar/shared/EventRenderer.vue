<script setup lang="ts">
import { areIntervalsOverlapping } from "date-fns"
import type { Schedule } from "nurekit"

interface Props {
	groupedEvents: Schedule[][]
	day: Date | string | number
	tz: string
}

const props = defineProps<Props>()



const renderEvents = computed(() => {
	const dayDate = parseDate(props.day)
	const groups = props.groupedEvents

	// Determine which groups overlap with at least one other group.
	// Done once as a pre-pass (O(G²) where G is group count, typically 1–5)
	// rather than inside the flatMap where it would run per-event (O(N²)).
	// Uses Unix ms directly to avoid parseDate allocations inside the loop.
	const overlappingGroups = new Set<number>()
	for (let i = 0; i < groups.length; i++) {
		if (overlappingGroups.has(i)) continue // already marked, no need to re-check
		for (let j = i + 1; j < groups.length; j++) {
			const iGroup = groups[i]!
			const jGroup = groups[j]!
			const overlaps = iGroup.some((a) =>
				jGroup.some((b) =>
					areIntervalsOverlapping(
						{ start: a.startedAt * 1000, end: a.endedAt * 1000 },
						{ start: b.startedAt * 1000, end: b.endedAt * 1000 }
					)
				)
			)
			if (overlaps) {
				overlappingGroups.add(i)
				overlappingGroups.add(j)
			}
		}
	}

	return groups.flatMap((group, groupIndex) =>
		group.map((event) => {
			const style = getEventBlockStyle(event, dayDate, groupIndex, groups.length, props.tz)
			const hasOverlap = overlappingGroups.has(groupIndex)
			return {
				event,
				style: hasOverlap ? style : { ...style, width: "100%", left: "0%" },
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
		<BigCalendarEventBlock :event="event" />
	</div>
</template>
