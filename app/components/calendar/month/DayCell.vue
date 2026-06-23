<script setup lang="ts">
import { startOfDay } from "date-fns"
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
	/** Whether the cell date is today — pre-baked by MonthView.buildPanel. */
	isDateToday: boolean
	/** Visible event groups — pre-baked by MonthView.buildPanel. */
	displayGroups: Schedule[][]
	/** Badge display data pre-baked at buildPanel time. */
	badges: BadgeData[]
	/** Hidden overflow events (shown in the "+N" popover). */
	hiddenEvents: Schedule[]
	hasMoreEvents: boolean
	remainingEventsCount: number
	totalEventsCount: number
}

const props = defineProps<Props>()

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

// Map badge key → badge data for O(1) lookup in the template when clicking a
// badge from displayGroups — group iteration uses the original Schedule, badge
// data provides the pre-baked colorClass and timeRange.
const badgeMap = computed(() => {
	const m = new Map<number | string, BadgeData>()
	for (const b of props.badges) m.set(b.key, b)
	return m
})
</script>

<template>
	<div
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
			class="flex flex-1 gap-1 overflow-hidden lg:flex-col lg:gap-1"
			:class="{ 'opacity-50': !cell.currentMonth }"
		>
			<!-- Mobile: tap whole cell → day view -->
			<div
				class="flex w-full cursor-pointer flex-wrap justify-center gap-1 lg:hidden"
				@click="handleMobileClick"
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
					v-for="(group, groupIndex) in displayGroups"
					:key="groupIndex"
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
							class="hide-time min-w-0 flex-1"
							@click="openEventPopover(event, $event.currentTarget as HTMLElement)"
						/>
					</template>

					<template v-else-if="group[0]">
						<BigCalendarMonthEventBadge
							:event="group[0]"
							:color-class="badgeMap.get(group[0].id)?.colorClass"
							:time-range="badgeMap.get(group[0].id)?.timeRange"
							:cell-date="startOfDay(cell.date)"
							class="w-full"
							@click="openEventPopover(group[0], $event.currentTarget as HTMLElement)"
						/>
					</template>
				</div>

				<div v-if="hasMoreEvents" class="flex h-6 shrink-0 gap-1">
					<BigCalendarMonthEventBadge
						@click="
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
		</div>
	</div>
</template>
