<script setup lang="ts">
import { isToday, startOfDay } from "date-fns"
import { useMediaQuery } from "@vueuse/core"
import type { Schedule } from "nurekit"
import { MAX_VISIBLE_EVENTS_PER_DAY } from "~/constants/calendar"
import type { ICalendarCell, TCalendarView } from "~/types/calendar"

interface Props {
	cell: ICalendarCell
	// Pre-filtered to this cell's date by MonthView — no need to scan the full event array.
	dayEvents: Schedule[]
}

const props = defineProps<Props>()

const calendarStore = useCalendarStore()
const { groupEventsBySameTime } = useEventGrouping()
const { trackEvent } = useAnalytics()

// Only mount the desktop popover block on lg+ screens. Mobile never mounts any
// Reka UI popover instances — tapping a cell navigates to day view instead.
// SSR default: true (desktop-first, avoids hydration flash on most users).
const isDesktop = useMediaQuery("(min-width: 1024px)", { ssrWidth: 1280 })

// Group same-time events — input is already filtered to this day.
const groupedCellEvents = computed(() => groupEventsBySameTime(props.dayEvents))

const isCurrentMonth = computed(() => props.cell.currentMonth)
const isDateToday = computed(() => isToday(props.cell.date))

const dayClasses = computed(() => ({
	"text-muted-foreground/50": !isCurrentMonth.value,
	"text-muted-foreground": isCurrentMonth.value && !isDateToday.value,
	"bg-primary ": isDateToday.value && isCurrentMonth.value,
}))

const containerClasses = computed(() => ({
	"opacity-80": !isCurrentMonth.value,
}))

// Single computed for all display-related derived values — evaluates groupedCellEvents once.
const cellDisplay = computed(() => {
	const groups = groupedCellEvents.value
	const total = groups.length

	const hiddenCount =
		total > MAX_VISIBLE_EVENTS_PER_DAY
			? groups.slice(MAX_VISIBLE_EVENTS_PER_DAY).reduce((n, g) => n + g.length, 0)
			: 0
	const onlyOneHidden = hiddenCount === 1
	const hasMoreEvents = total > MAX_VISIBLE_EVENTS_PER_DAY && !onlyOneHidden
	const maxVisible = onlyOneHidden ? MAX_VISIBLE_EVENTS_PER_DAY + 1 : MAX_VISIBLE_EVENTS_PER_DAY

	return {
		displayGroups: groups.slice(0, maxVisible),
		hasMoreEvents,
		remainingEventsCount: hasMoreEvents ? hiddenCount : 0,
		hiddenEvents: groups.slice(MAX_VISIBLE_EVENTS_PER_DAY).flat(),
		totalEventsCount: groups.reduce((n, g) => n + g.length, 0),
	}
})

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

function openOverflowPopover(hiddenEvents: Schedule[], triggerEl: HTMLElement) {
	anchorEl.value = triggerEl
	activeEvent.value = null
	activeHiddenEvents.value = hiddenEvents
	popoverMode.value = "overflow"
	popoverOpen.value = true
}

function handleMobileClick() {
	calendarStore.setSelectedDate(props.cell.date)
	calendarStore.setView("day" as TCalendarView)
	trackEvent("view_changed", { view: "day", source: "day_cell" })
}
</script>

<template>
	<div class="bg-card flex h-full flex-col overflow-hidden p-2.5" :class="containerClasses">
		<div class="flex h-8 w-full shrink-0 items-center justify-center">
			<span
				class="flex size-6 items-center justify-center rounded-full text-xs font-medium"
				:class="dayClasses"
			>
				{{ cell.day }}
			</span>
		</div>

		<div
			class="flex flex-1 gap-1 overflow-hidden lg:flex-col lg:gap-1"
			:class="{ 'opacity-50': !isCurrentMonth }"
		>
			<!-- Mobile: tap whole cell → day view -->
			<div
				class="flex w-full cursor-pointer flex-wrap justify-center gap-1 lg:hidden"
				@click="handleMobileClick"
			>
				<span
					v-if="cellDisplay.totalEventsCount > 0"
					class="bg-primary flex size-5 items-center justify-center rounded-full text-xs
						font-semibold"
				>
					{{ cellDisplay.totalEventsCount }}
				</span>
			</div>

			<!-- Desktop: per-event badges with a single shared popover per cell -->
			<template v-if="isDesktop">
				<div class="hidden lg:flex lg:h-full lg:flex-col lg:gap-1 lg:overflow-hidden">
					<div
						v-for="(group, groupIndex) in cellDisplay.displayGroups"
						:key="groupIndex"
						class="flex h-6 shrink-0 gap-1"
					>
						<template v-if="group.length > 1">
							<BigCalendarMonthEventBadge
								v-for="event in group"
								:key="event.id"
								:event="event"
								:cell-date="startOfDay(cell.date)"
								class="hide-time min-w-0 flex-1"
								@click="openEventPopover(event, $event.currentTarget as HTMLElement)"
							/>
						</template>

						<template v-else-if="group[0]">
							<BigCalendarMonthEventBadge
								:event="group[0]"
								:cell-date="startOfDay(cell.date)"
								class="w-full"
								@click="openEventPopover(group[0], $event.currentTarget as HTMLElement)"
							/>
						</template>
					</div>

					<div v-if="cellDisplay.hasMoreEvents" class="flex h-6 shrink-0 gap-1">
						<BigCalendarMonthEventBadge
							@click="
								openOverflowPopover(cellDisplay.hiddenEvents, $event.currentTarget as HTMLElement)
							"
						>
							<span class="flex-1 shrink-0 truncate">
								ще {{ cellDisplay.remainingEventsCount }}
								{{ cellDisplay.remainingEventsCount === 1 ? "заняття" : "занять" }}
							</span>
						</BigCalendarMonthEventBadge>
					</div>
				</div>

				<!-- One shared popover per cell, anchored to the last-clicked badge element -->
				<UiPopover v-model:open="popoverOpen">
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
			</template>
		</div>
	</div>
</template>
