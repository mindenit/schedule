<script setup lang="ts">
import { areIntervalsOverlapping } from "date-fns"
import type { Schedule } from "nurekit"

interface Props {
	groupedEvents: Schedule[][]
	day: Date | string | number
	tz: string
}

const props = defineProps<Props>()

/**
 * Cache the overlap set by groupedEvents array identity.
 * When the same panel snapshot is passed on every animation frame (no data
 * change mid-flight), the O(G²) pre-pass runs exactly once per panel build
 * instead of once per rendered frame. Keyed by the array reference so stale
 * entries are GC'd automatically when the snapshot is replaced.
 */
const overlapCache = new WeakMap<Schedule[][], Set<number>>()

function computeOverlappingGroups(groups: Schedule[][]): Set<number> {
	const cached = overlapCache.get(groups)
	if (cached) return cached

	const overlappingGroups = new Set<number>()
	for (let i = 0; i < groups.length; i++) {
		if (overlappingGroups.has(i)) continue
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

	overlapCache.set(groups, overlappingGroups)
	return overlappingGroups
}

const renderEvents = computed(() => {
	const dayDate = parseDate(props.day)
	const groups = props.groupedEvents
	const overlappingGroups = computeOverlappingGroups(groups)

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
