<script setup lang="ts">
import type { Schedule } from "nurekit"
import { motion } from "motion-v"
import { isSameDay, isSameMonth } from "date-fns"
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

// Reactive "today" — updates every minute so the today-highlight stays correct
// if the tab is left open across midnight. Avoids baking isToday into snapshots
// (which would go stale until the user navigates).
const now = useNow({ interval: 60_000 })
const today = computed(() => now.value)

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
	/**
	 * All time-slot groups for this day — DayCell slices this based on measured height.
	 * Replaces the old pre-sliced displayGroups so the visible count can be dynamic.
	 */
	allGroups: Schedule[][]
	/** Pre-baked badge data for every event across all groups (keyed by event id). */
	allBadges: BadgeData[]
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
 * - colorClass: eliminates ~300 EVENT_TYPE_COLORS lookups per nav (one per badge)
 * - timeRange: already WeakMap-cached in event-cache.ts; calling it here is O(1) per badge
 *
 * NOTE: isDateToday is NOT baked here. It is computed reactively at bind time using the
 * `today` ref (updated every minute), so the highlight stays correct if the tab is
 * left open past midnight without user navigation.
 */
function buildPanel(date: Date): MonthPanel {
	const cells = getCalendarCells(date)
	const evMap = eventsByDayKey.value
	const tz = effectiveTimezone.value

	const cellSnapshots: MonthCellSnapshot[] = cells.map((cell) => {
		const dayEvents = evMap.get(cell.date.getTime()) ?? []
		const groups = groupEventsBySameTime(dayEvents)

		// Pre-bake badge data for ALL groups — DayCell will slice to what fits.
		const allBadges: BadgeData[] = groups.flatMap((group) =>
			group.map((event) => ({
				key: event.id,
				event,
				colorClass:
					EVENT_TYPE_COLORS[event.type as keyof typeof EVENT_TYPE_COLORS] ?? FALLBACK_COLOR,
				timeRange: getEventTimeRange(event, tz),
			}))
		)

		return {
			cell,
			allGroups: groups,
			allBadges,
			totalEventsCount: groups.reduce((n, g) => n + g.length, 0),
		}
	})

	return { date, cellSnapshots, weeksCount: Math.ceil(cells.length / 7) }
}

const monthRootEl = useTemplateRef("monthRoot")

const { currentPanel, incomingPanel, currentX, incomingX, onDragStart, onDrag, onDragEnd } =
	useSwipeNavigator<MonthPanel>({
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

		<div class="relative min-h-0 flex-1 overflow-hidden rounded-b-2xl">
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
					:is-date-today="isSameDay(snapshot.cell.date, today)"
					:all-groups="snapshot.allGroups"
					:all-badges="snapshot.allBadges"
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
					:is-date-today="isSameDay(snapshot.cell.date, today)"
					:all-groups="snapshot.allGroups"
					:all-badges="snapshot.allBadges"
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
