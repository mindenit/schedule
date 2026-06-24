<script setup lang="ts">
import type { Schedule } from "nurekit"
import { motion } from "motion-v"
import { isToday, isSameMonth } from "date-fns"
import type { ICalendarCell } from "~/types/calendar"
import { getEventTimeRange } from "~/utils/event-cache"

interface Props {
	events: Schedule[]
}

// Props accepted so Root.vue's contract is unchanged.
// hasEvents uses props.events (filter-aware). Grid cells come from the store date.
const props = defineProps<Props>()

const calendarStore = useCalendarStore()
const { selectedDate, eventsByDayKey } = storeToRefs(calendarStore)
const { effectiveTimezone } = useTimezone()

const { getCalendarCells, getWeekDays } = useCalendarCells()

const hasEvents = computed(() => props.events.length > 0)
const weekDays = computed(() => getWeekDays(selectedDate.value))

/**
 * Pre-baked badge data: computed once at buildPanel time, not on every badge mount.
 * colorClass + timeRange are the two most expensive fields (useEventFormatting lookup +
 * getEventTimeRange with WeakMap + timezone). Pre-baking them means MonthEventBadge
 * renders as a near-zero-cost "dumb" component — no composable calls, no computeds.
 */
interface BadgeData {
	/** Unique key for v-for — event id is stable across renders. */
	key: number | string
	event: Schedule
	colorClass: string
	timeRange: string
}

interface MonthCellSnapshot {
	cell: ICalendarCell
	/** Whether the cell date is today — pre-baked so isToday() is not called per render. */
	isDateToday: boolean
	/**
	 * All display-related derived values baked at buildPanel time.
	 * DayCell no longer runs groupEventsBySameTime() per render.
	 */
	displayGroups: Schedule[][]
	badges: BadgeData[]
	hiddenEvents: Schedule[]
	hasMoreEvents: boolean
	remainingEventsCount: number
	totalEventsCount: number
}

interface MonthPanel {
	date: Date
	cellSnapshots: MonthCellSnapshot[]
	weeksCount: number
}

const FALLBACK_COLOR = "bg-muted text-muted-foreground"

/**
 * Build a fully frozen panel snapshot for the given month.
 *
 * ALL per-cell and per-badge computation happens here, once, at navigation time.
 * Nothing in the rendering pipeline (DayCell / MonthEventBadge) does expensive
 * work after this point.
 *
 * - groupEventsBySameTime: eliminates 84 grouping passes (42 cells × 2 panels) per nav
 * - isToday: eliminates 84 date-fns isToday() calls (allocates Date + startOfDay each)
 * - colorClass: eliminates ~300 EVENT_TYPE_COLORS lookups per nav (one per badge)
 * - timeRange: already WeakMap-cached in event-cache.ts; calling it here is O(1) per badge
 */
function buildPanel(date: Date): MonthPanel {
	const cells = getCalendarCells(date)
	const evMap = eventsByDayKey.value
	const tz = effectiveTimezone.value

	const cellSnapshots: MonthCellSnapshot[] = cells.map((cell) => {
		const dayEvents = evMap.get(cell.date.getTime()) ?? []
		const groups = groupEventsBySameTime(dayEvents)
		const total = groups.length

		const hiddenCount =
			total > MAX_VISIBLE_EVENTS_PER_DAY
				? groups.slice(MAX_VISIBLE_EVENTS_PER_DAY).reduce((n, g) => n + g.length, 0)
				: 0
		const onlyOneHidden = hiddenCount === 1
		const hasMoreEvents = total > MAX_VISIBLE_EVENTS_PER_DAY && !onlyOneHidden
		const maxVisible = onlyOneHidden ? MAX_VISIBLE_EVENTS_PER_DAY + 1 : MAX_VISIBLE_EVENTS_PER_DAY

		const displayGroups = groups.slice(0, maxVisible)

		// Pre-bake badge data for each visible group's events.
		const badges: BadgeData[] = displayGroups.flatMap((group) =>
			group.map((event) => ({
				key: event.id,
				event,
				colorClass: EVENT_TYPE_COLORS[event.type as keyof typeof EVENT_TYPE_COLORS] ?? FALLBACK_COLOR,
				timeRange: getEventTimeRange(event, tz),
			}))
		)

		return {
			cell,
			isDateToday: isToday(cell.date),
			displayGroups,
			badges,
			hiddenEvents: groups.slice(MAX_VISIBLE_EVENTS_PER_DAY).flat(),
			hasMoreEvents,
			remainingEventsCount: hasMoreEvents ? hiddenCount : 0,
			totalEventsCount: groups.reduce((n, g) => n + g.length, 0),
		}
	})

	return { date, cellSnapshots, weeksCount: Math.ceil(cells.length / 7) }
}

const monthRootEl = useTemplateRef("monthRoot")

const {
	currentPanel,
	incomingPanel,
	currentX,
	incomingX,
	onDragStart,
	onDrag,
	onDragEnd,
} = useSwipeNavigator<MonthPanel>({
	view: "month",
	containerRef: monthRootEl,
	buildPanel,
	samePeriod: isSameMonth,
	events: () => props.events,
	timezone: () => effectiveTimezone.value,
})
</script>

<template>
	<div ref="monthRoot" class="relative flex h-full flex-col">
		<!-- Week day header — outside the animated panels, always visible -->
		<div role="row" class="mb-1 grid flex-shrink-0 grid-cols-7 gap-1">
		<div
			v-for="day in weekDays"
			:key="day"
			role="columnheader"
			:aria-label="day"
			class="bg-muted/50 text-muted-foreground flex items-center justify-center py-2 text-xs
				font-medium md:first:rounded-tl-2xl md:last:rounded-tr-2xl"
		>
			{{ day }}
		</div>
		</div>

		<div
			class="relative min-h-0 flex-1 overflow-hidden rounded-b-2xl"
			:class="{ 'blur-sm': !hasEvents }"
		>
		<!--
			Incoming panel — rendered as a non-interactive grid during animation.
			:interactive="false" on each DayCell skips UiPopover + click handlers +
			hover/cursor/transition on badges, eliminating the per-cell component
			mount cost (~42 Popover trees) that caused dense-month animation lag.
			Markup and sizing are pixel-identical to the live panel, so there is no
			visible pop when currentPanel is promoted on settle.
		-->
		<motion.div
			v-if="incomingPanel"
			role="grid"
			aria-hidden="true"
			class="absolute inset-0 grid grid-cols-7 gap-1 overflow-hidden"
			:style="{
				gridTemplateRows: `repeat(${incomingPanel.weeksCount}, 1fr)`,
				x: incomingX,
				willChange: 'transform',
				contain: 'layout paint',
			}"
		>
			<BigCalendarDayCell
				v-for="(snapshot, index) in incomingPanel.cellSnapshots"
				:key="index"
				:cell="snapshot.cell"
				:is-date-today="snapshot.isDateToday"
				:display-groups="snapshot.displayGroups"
				:badges="snapshot.badges"
				:hidden-events="snapshot.hiddenEvents"
				:has-more-events="snapshot.hasMoreEvents"
				:remaining-events-count="snapshot.remainingEventsCount"
				:total-events-count="snapshot.totalEventsCount"
				:interactive="false"
				class="min-h-0"
			/>
		</motion.div>

			<!-- Current panel — always rendered, interactive, draggable -->
			<motion.div
				role="grid"
				:aria-label="`Місяць: ${currentPanel.date.toLocaleDateString('uk-UA', { month: 'long', year: 'numeric' })}`"
				class="absolute inset-0 grid grid-cols-7 gap-1 overflow-hidden"
				:style="{
					gridTemplateRows: `repeat(${currentPanel.weeksCount}, 1fr)`,
					x: currentX,
					willChange: 'transform',
					contain: 'layout paint',
				}"
				drag="x"
				:drag-constraints="{ left: 0, right: 0 }"
				:drag-elastic="0.1"
				:drag-momentum="false"
				@drag-start="onDragStart"
				@drag="onDrag"
				@drag-end="onDragEnd"
			>
				<BigCalendarDayCell
					v-for="(snapshot, index) in currentPanel.cellSnapshots"
					:key="index"
					:cell="snapshot.cell"
					:is-date-today="snapshot.isDateToday"
					:display-groups="snapshot.displayGroups"
					:badges="snapshot.badges"
					:hidden-events="snapshot.hiddenEvents"
					:has-more-events="snapshot.hasMoreEvents"
					:remaining-events-count="snapshot.remainingEventsCount"
					:total-events-count="snapshot.totalEventsCount"
					class="min-h-0"
				/>
			</motion.div>
		</div>

		<BigCalendarEmptyStateOverlay
			:show="!hasEvents"
			description="У цьому місяці немає запланованих пар"
		/>
	</div>
</template>
