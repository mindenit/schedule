<script setup lang="ts">
import { areIntervalsOverlapping } from "date-fns"
import type { Schedule } from "nurekit"

interface Props {
	groupedEvents: Schedule[][]
	day: Date | string | number
	tz: string
	/** Forwarded to each EventBlock — false disables Popover/click during animation. */
	interactive?: boolean
	/**
	 * When true, all events always render as individual EventBlock elements on all
	 * screen sizes — chips are never shown. Use in DayView where the column is wide
	 * enough to show overlapping events side-by-side even on mobile.
	 */
	disableChips?: boolean
	/**
	 * Forwarded to each EventBlock — when true shows extra detail lines
	 * (time, auditorium, teacher). Use in DayView where blocks are wide enough.
	 */
	detailed?: boolean
}

const props = withDefaults(defineProps<Props>(), {
	interactive: true,
	disableChips: false,
	detailed: false,
})

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

interface RenderedEvent {
	event: Schedule
	style: ReturnType<typeof getEventBlockStyle>
	key: string
	/** True when this event belongs to a time slot that has other simultaneous events. */
	isStacked: boolean
}

interface RenderedChip {
	events: Schedule[]
	/** Positioned at full width of the column (groupIndex=0, groupSize=1). */
	style: ReturnType<typeof getEventBlockStyle>
	key: string
}

interface RenderData {
	events: RenderedEvent[]
	chips: RenderedChip[]
}

const renderData = computed((): RenderData => {
	const dayDate = parseDate(props.day)
	const groups = props.groupedEvents

	// Build a map of timeKey → all events sharing that exact start+end window.
	// Used to determine which events are "same-time stacked" for mobile chip rendering.
	const sameTimeMap = new Map<string, Schedule[]>()
	for (const group of groups) {
		for (const event of group) {
			const tk = `${event.startedAt}-${event.endedAt}`
			if (!sameTimeMap.has(tk)) sameTimeMap.set(tk, [])
			sameTimeMap.get(tk)!.push(event)
		}
	}

	// Set of event IDs that are part of a stacked slot (2+ events with same time).
	const stackedIds = new Set<number>()
	// Map timeKey → chip events (only for slots with 2+ events).
	const chipSlots = new Map<string, Schedule[]>()
	for (const [tk, evts] of sameTimeMap) {
		if (evts.length >= 2) {
			for (const e of evts) stackedIds.add(e.id)
			chipSlots.set(tk, evts)
		}
	}

	const events: RenderedEvent[] = groups.flatMap((group, groupIndex) =>
		group.map((event) => {
			const concurrent = getConcurrentGroupIndices(event, groups)
			const localGroupCount = concurrent.length
			const localGroupIndex = concurrent.indexOf(groupIndex)
			const style = getEventBlockStyle(
				event,
				dayDate,
				localGroupIndex,
				localGroupCount,
				props.tz
			)
			return {
				event,
				style,
				key: `${event.id}-${groupIndex}`,
				isStacked: stackedIds.has(event.id),
			}
		})
	)

	// One chip per unique same-time slot, positioned full-width (groupSize=1).
	const chips: RenderedChip[] = []
	for (const [tk, evts] of chipSlots) {
		const representative = evts[0]!
		const style = getEventBlockStyle(representative, dayDate, 0, 1, props.tz)
		chips.push({ events: evts, style, key: `chip-${tk}` })
	}

	return { events, chips }
})
</script>

<template>
	<!--
		Individual event blocks.
		On mobile (< lg): stacked events are invisible unless disableChips=true.
		On desktop (lg+): always visible regardless of stacking.
	-->
	<div
		v-for="{ event, style, key, isStacked } in renderData.events"
		:key="key"
		class="absolute px-0.5"
		:class="!disableChips && isStacked ? 'hidden lg:block' : ''"
		:style="style"
	>
		<BigCalendarEventBlock
			:event="event"
			:interactive="props.interactive"
			:detailed="props.detailed"
		/>
	</div>

	<!--
		Mobile-only stack chips (< lg).
		One chip per same-time slot with 2+ events — full column width,
		tap opens MoreEventsPopover list.
		Hidden on desktop (lg+) or when disableChips=true (e.g. DayView).
	-->
	<div
		v-for="{ events, style, key } in renderData.chips"
		:key="key"
		class="absolute px-0.5 lg:hidden"
		:class="disableChips ? 'hidden' : 'block'"
		:style="style"
	>
		<BigCalendarEventStackChip
			:events="events"
			:day="parseDate(day)"
			:interactive="props.interactive"
		/>
	</div>
</template>
