<script setup lang="ts">
import { startOfDay } from "date-fns"
import { useResizeObserver } from "@vueuse/core"
import type { Schedule } from "nurekit"
import type { ICalendarCell, TCalendarView } from "~/types/calendar"

interface BadgeData {
	key: number | string
	event: Schedule
	colorClass: string
	timeRange: string
}

interface Props {
	cell: ICalendarCell
	/** Whether the cell date is today — computed reactively in MonthView from a useNow() ref. */
	isDateToday: boolean
	/**
	 * All time-slot groups for this day — DayCell slices this based on measured
	 * event-area height so the visible count adapts to the actual cell size.
	 */
	allGroups: Schedule[][]
	/** Pre-baked badge data for every event across all groups (keyed by event id). */
	allBadges: BadgeData[]
	totalEventsCount: number
	/**
	 * When false (incoming panel during slide animation), all interactive
	 * machinery is skipped: UiPopover, click handlers, cursor-pointer.
	 * Markup, sizing and badge presentation stay pixel-identical to the live cell.
	 * Defaults to true.
	 */
	interactive?: boolean
}

const props = withDefaults(defineProps<Props>(), { interactive: true })

const calendarStore = useCalendarStore()

const { trackEvent } = useAnalytics()

// dayClasses and containerClasses are still lightweight computeds — they derive
// from cell.currentMonth / isDateToday which are already resolved props.
const dayClasses = computed(() => ({
	"text-muted-foreground/50": !props.cell.currentMonth,
	"text-muted-foreground": props.cell.currentMonth && !props.isDateToday,
	"bg-primary ": props.isDateToday && props.cell.currentMonth,
}))

const containerClasses = computed(() => ({
	"opacity-80": !props.cell.currentMonth,
}))

// ── Dynamic slot calculation ─────────────────────────────────────────────────
// Each badge row is h-6 (24px) with gap-1 (4px) between rows.
// We measure the event-area container and derive how many rows fit, reserving
// one slot for the "ще N занять" overflow badge when needed.
const ROW_HEIGHT_PX = 24 // h-6
const ROW_GAP_PX = 4 // gap-1

const eventAreaEl = useTemplateRef("eventArea")
const eventAreaHeight = ref(0)

// Delta gate: only update when height changes by more than 4px to suppress
// sub-pixel jitter from browser layout rounding and scrollbar apparition.
let _lastEventAreaHeight = 0
useResizeObserver(eventAreaEl, ([entry]) => {
	const h = entry.contentRect.height
	if (Math.abs(h - _lastEventAreaHeight) > 4) {
		_lastEventAreaHeight = h
		eventAreaHeight.value = h
	}
})

/**
 * How many badge rows fit in the currently measured event area.
 * Falls back to MAX_VISIBLE_EVENTS_PER_DAY until the ResizeObserver fires.
 */
const slotsAvailable = computed(() => {
	if (eventAreaHeight.value === 0) return MAX_VISIBLE_EVENTS_PER_DAY
	// Each row takes ROW_HEIGHT_PX; gaps sit between rows so the nth row adds
	// ROW_GAP_PX only from the second row onward.
	// Solve: ROW_HEIGHT_PX + (n-1) * (ROW_HEIGHT_PX + ROW_GAP_PX) ≤ h
	//   → n ≤ (h - ROW_HEIGHT_PX) / (ROW_HEIGHT_PX + ROW_GAP_PX) + 1
	return Math.max(
		1,
		Math.floor((eventAreaHeight.value - ROW_HEIGHT_PX) / (ROW_HEIGHT_PX + ROW_GAP_PX) + 1)
	)
})

const displayGroups = computed(() => {
	const total = props.allGroups.length
	if (total <= slotsAvailable.value) return props.allGroups

	// Reserve 1 slot for the overflow badge — unless doing so would hide exactly
	// 1 event, in which case we just show it directly (no badge needed).
	const slots = slotsAvailable.value
	const wouldHide = total - (slots - 1)
	if (wouldHide === 1) {
		// Show all: the "one hidden" heuristic — display the extra event directly.
		return props.allGroups.slice(0, slots)
	}
	return props.allGroups.slice(0, slots - 1)
})

const hiddenEvents = computed(() => props.allGroups.slice(displayGroups.value.length).flat())

const hasMoreEvents = computed(() => hiddenEvents.value.length > 0)

const remainingEventsCount = computed(() => hiddenEvents.value.length)

// Single shared popover per cell — one UiPopover instance instead of one per event.
// The anchor is set to the clicked badge element so Reka UI positions correctly.
const popoverOpen = ref(false)
const anchorEl = ref<HTMLElement | null>(null)
const activeEvent = ref<Schedule | null>(null)
const activeHiddenEvents = ref<Schedule[]>([])
const popoverMode = ref<"event" | "overflow">("event")

function openEventPopover(event: Schedule, triggerEl: HTMLElement) {
	anchorEl.value = triggerEl
	activeEvent.value = event
	activeHiddenEvents.value = []
	popoverMode.value = "event"
	popoverOpen.value = true
	trackEvent("event_opened", { lesson_type: event.type })
}

function openOverflowPopover(events: Schedule[], triggerEl: HTMLElement) {
	anchorEl.value = triggerEl
	activeEvent.value = null
	activeHiddenEvents.value = events
	popoverMode.value = "overflow"
	popoverOpen.value = true
	trackEvent("more_events_opened")
}

function handleMobileClick() {
	calendarStore.setSelectedDate(props.cell.date)
	calendarStore.setView("day" as TCalendarView)
	trackEvent("view_changed", { view: "day", source: "day_cell" })
}

// Map badge key → badge data for O(1) lookup in the template when clicking a
// badge from displayGroups — group iteration uses the original Schedule, badge
// data provides the pre-baked colorClass and timeRange.
const badgeMap = computed(() => {
	const m = new Map<number | string, BadgeData>()
	for (const b of props.allBadges) m.set(b.key, b)
	return m
})
</script>

<template>
	<div
		role="gridcell"
		:aria-label="
			cell.date.toLocaleDateString('uk-UA', {
				weekday: 'long',
				day: 'numeric',
				month: 'long',
			}) +
			(totalEventsCount > 0
				? `, ${totalEventsCount} ${pluralUk(totalEventsCount, 'заняття', 'заняття', 'занять')}`
				: '')
		"
		:aria-selected="isDateToday"
		class="bg-card flex h-full flex-col overflow-hidden p-2.5"
		:class="containerClasses"
	>
		<div class="flex h-8 w-full shrink-0 items-center justify-center">
			<span
				class="flex size-6 items-center justify-center rounded-full text-xs font-medium"
				:class="dayClasses"
			>
				{{ cell.day }}
			</span>
		</div>

		<div
			ref="eventArea"
			class="flex flex-1 gap-1 overflow-hidden lg:flex-col lg:gap-1"
			:class="{ 'opacity-50': !cell.currentMonth }"
		>
			<!-- Mobile: tap whole cell → day view -->
			<div
				class="flex w-full flex-wrap justify-center gap-1 lg:hidden"
				:class="{ 'cursor-pointer': interactive }"
				@click="interactive && handleMobileClick()"
			>
				<span
					v-if="totalEventsCount > 0"
					:aria-label="`${totalEventsCount} ${pluralUk(totalEventsCount, 'заняття', 'заняття', 'занять')}`"
					class="bg-primary flex size-5 items-center justify-center rounded-full text-xs
						font-semibold"
				>
					{{ totalEventsCount }}
				</span>
			</div>

			<!-- Desktop: per-event badges with a single shared popover per cell -->
			<!-- No ClientOnly: CSS hidden/lg:flex keeps SSR and client HTML identical. -->
			<!-- The popover is interactive only after hydration (click handlers attach -->
			<!-- on mount), but the static HTML structure matches on both sides. -->
			<div class="hidden lg:flex lg:h-full lg:flex-col lg:gap-1 lg:overflow-hidden">
				<div
					v-for="group in displayGroups"
					:key="group.map((e) => e.id).join('-')"
					v-memo="[group.map((e) => e.id).join('-'), interactive]"
					class="flex h-6 shrink-0 gap-1"
				>
					<template v-if="group.length > 1">
						<BigCalendarMonthEventBadge
							v-for="event in group"
							:key="event.id"
							:event="event"
							:color-class="badgeMap.get(event.id)?.colorClass"
							:time-range="badgeMap.get(event.id)?.timeRange"
							:cell-date="startOfDay(cell.date)"
							:interactive="interactive"
							class="hide-time min-w-0 flex-1"
							@click="
								interactive &&
								openEventPopover(event, $event.currentTarget as HTMLElement)
							"
						/>
					</template>

					<template v-else-if="group[0]">
						<BigCalendarMonthEventBadge
							:event="group[0]"
							:color-class="badgeMap.get(group[0].id)?.colorClass"
							:time-range="badgeMap.get(group[0].id)?.timeRange"
							:cell-date="startOfDay(cell.date)"
							:interactive="interactive"
							class="w-full"
							@click="
								interactive &&
								openEventPopover(group[0], $event.currentTarget as HTMLElement)
							"
						/>
					</template>
				</div>

				<div v-if="hasMoreEvents" class="flex h-6 shrink-0 gap-1">
					<BigCalendarMonthEventBadge
						:interactive="interactive"
						@click="
							interactive &&
							openOverflowPopover(hiddenEvents, $event.currentTarget as HTMLElement)
						"
					>
						<span class="flex-1 shrink-0 truncate">
							ще {{ remainingEventsCount }}
							{{ pluralUk(remainingEventsCount, "заняття", "заняття", "занять") }}
						</span>
					</BigCalendarMonthEventBadge>
				</div>
			</div>

			<!-- One shared popover per cell, anchored to the last-clicked badge element -->
			<!-- v-if="interactive": skip mounting the Popover tree entirely on the incoming -->
			<!-- (non-interactive) panel — this is the primary cost saving for animation lag. -->
			<UiPopover v-if="interactive" v-model:open="popoverOpen">
				<UiPopoverAnchor :reference="anchorEl ?? undefined" />
				<UiPopoverContent class="w-80">
					<BigCalendarEventPopover
						v-if="popoverMode === 'event' && activeEvent"
						:event="activeEvent"
					/>
					<BigCalendarMoreEventsPopover
						v-else-if="popoverMode === 'overflow'"
						:events="activeHiddenEvents"
						:date="cell.date"
					/>
				</UiPopoverContent>
			</UiPopover>
		</div>
	</div>
</template>
