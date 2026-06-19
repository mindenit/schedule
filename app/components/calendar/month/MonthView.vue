<script setup lang="ts">
import type { Schedule } from "nurekit"
import { storeToRefs } from "pinia"
import { motion, AnimatePresence } from "motion-v"

interface Props {
	events: Schedule[]
}

// Props still accepted so Root.vue's contract is unchanged.
// MonthView ignores props.events and reads the store index directly —
// this avoids rebuilding a day-keyed map on every selectedDate change.
const props = defineProps<Props>()

const calendarStore = useCalendarStore()
const { selectedDate, eventsByDayKey } = storeToRefs(calendarStore)
const { trackEvent } = useAnalytics()

const { getCalendarCells, getWeekDays } = useCalendarCells()

const cells = computed(() => getCalendarCells(selectedDate.value))
const weekDays = computed(() => getWeekDays(selectedDate.value))

// hasEvents still uses the prop (filter-aware, window-filtered by Root.vue).
const hasEvents = computed(() => props.events.length > 0)
const weeksCount = computed(() => Math.ceil(cells.value.length / 7))

const monthViewEl = useTemplateRef("monthViewContainer")
const { direction, isSwiping } = useSwipe(monthViewEl)

const isAnimating = ref(false)
const swipeDirection = ref<"left" | "right" | null>(null)
const dateKey = ref(selectedDate.value.toISOString())
const animationCounter = ref(0)

const handleSwipe = (direction: "left" | "right") => {
	isAnimating.value = true
	swipeDirection.value = direction
	animationCounter.value++

	const navDirection = direction === "left" ? "next" : "previous"
	const newDate = navigateDate(selectedDate.value, "month", navDirection)

	dateKey.value = newDate.toISOString()
	calendarStore.setSelectedDate(newDate)
	trackEvent("date_navigated", {
		direction: direction === "left" ? "next" : "prev",
		view: "month",
		source: "swipe",
	})

	setTimeout(() => {
		isAnimating.value = false
		swipeDirection.value = null
	}, SWIPE_ANIMATION_CONFIG.duration)
}

watch(isSwiping, (swiping) => {
	if (swiping && !isAnimating.value) {
		if (direction.value === "right") {
			handleSwipe("right")
		} else if (direction.value === "left") {
			handleSwipe("left")
		}
	}
})
</script>

<template>
	<div class="relative flex h-full flex-col">
		<div class="mb-1 grid flex-shrink-0 grid-cols-7 gap-1">
			<div
				v-for="day in weekDays"
				:key="day"
				class="bg-muted/50 text-muted-foreground flex items-center justify-center py-2 text-xs
					font-medium md:first:rounded-tl-2xl md:last:rounded-tr-2xl"
			>
				{{ day }}
			</div>
		</div>

		<div
			ref="monthViewContainer"
			class="relative min-h-0 flex-1 overflow-hidden rounded-b-2xl"
			:class="{ 'blur-sm': !hasEvents }"
		>
			<AnimatePresence :initial="false" :custom="swipeDirection">
				<motion.div
					:key="dateKey"
					ref="monthView"
					:class="
						isAnimating
							? 'absolute inset-0 grid grid-cols-7 gap-1 overflow-hidden'
							: 'grid h-full grid-cols-7 gap-1 overflow-hidden'
					"
					:style="
						isAnimating
							? { zIndex: 11, gridTemplateRows: `repeat(${weeksCount}, 1fr)` }
							: { gridTemplateRows: `repeat(${weeksCount}, 1fr)` }
					"
					:custom="swipeDirection"
					:variants="SWIPE_ANIMATION_CONFIG.variants"
					:initial="isAnimating ? 'enter' : false"
					:animate="'center'"
					:exit="'exit'"
				>
					<BigCalendarDayCell
						v-for="(cell, index) in cells"
						:key="index"
						:cell="cell"
						:day-events="eventsByDayKey.get(cell.date.getTime()) ?? []"
						class="min-h-0"
					/>
				</motion.div>
			</AnimatePresence>
		</div>

		<BigCalendarEmptyStateOverlay
			:show="!hasEvents"
			description="У цьому місяці немає запланованих пар"
		/>
	</div>
</template>
