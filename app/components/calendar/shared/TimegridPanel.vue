<script setup lang="ts">
import type { Schedule } from "@mindenit/nurekit"
import { CALENDAR_HOURS } from "~/constants/calendar"

interface Props {
	/** Pre-grouped events for a single day column (day view) or one column per element (week view). */
	groupedEvents: Schedule[][]
	/** The calendar day this panel represents — passed through to EventRenderer. */
	day: Date
	/** IANA timezone string for event positioning. */
	tz: string
	/**
	 * When false (incoming animation panel), EventBlock popovers and click handlers
	 * are suppressed. Markup and sizing stay identical for smooth animation.
	 */
	interactive?: boolean
	/**
	 * When true the current-time Timeline is rendered inside the panel.
	 * Only pass true on the live (current) day-view panel.
	 */
	showTimeline?: boolean
	/**
	 * Unique key for EventRenderer — used when the parent renders multiple panels
	 * and needs to force a re-mount on date change (e.g. DayView after navigation).
	 */
	rendererKey?: string | number
	/**
	 * When true, simultaneous events always render as individual blocks (no chips).
	 * Pass true in DayView where the wide single column makes chips unnecessary.
	 */
	disableChips?: boolean
	/**
	 * When true, EventBlock renders extra detail lines (time, auditorium, teacher).
	 * Use in DayView where blocks are wide and tall enough to show this comfortably.
	 */
	detailed?: boolean
}

withDefaults(defineProps<Props>(), {
	interactive: true,
	showTimeline: false,
	rendererKey: undefined,
	disableChips: false,
	detailed: false,
})

const { formatHour } = useEventFormatting()
const hours = CALENDAR_HOURS
</script>

<template>
	<!--
		Single time-grid panel: hour-gutter on the left + event-grid on the right.
		Shared by DayView (one instance) and WeekView (one column per day).
		The parent is responsible for the outer motion.div and absolute positioning.
	-->
	<div class="flex min-h-0 flex-1 gap-1">
		<!-- Hour gutter -->
		<div class="relative flex w-18 shrink-0 flex-col">
			<div
				v-for="(hour, index) in hours"
				:key="hour"
				class="bg-muted/50 relative flex flex-1 items-start justify-end pr-2"
			>
				<span v-if="index !== 0" class="text-muted-foreground text-xs">
					{{ formatHour(hour) }}
				</span>
			</div>
		</div>

		<!-- Event grid -->
		<div class="relative flex-1">
			<div class="flex h-full flex-col gap-1">
				<div v-for="hour in hours" :key="hour" class="bg-card relative flex-1" />
			</div>
			<div class="absolute inset-0">
				<BigCalendarEventRenderer
					:key="rendererKey"
					:grouped-events="groupedEvents"
					:day="day"
					:tz="tz"
					:interactive="interactive"
					:disable-chips="disableChips"
					:detailed="detailed"
				/>
			</div>
			<BigCalendarTimeline v-if="showTimeline" />
		</div>
	</div>
</template>
