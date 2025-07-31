<script setup lang="ts">
import type { Schedule } from "nurekit"
import { storeToRefs } from "pinia"
import { motion, AnimatePresence } from "motion-v"

interface Props {
	events: Schedule[]
}

const props = defineProps<Props>()

const calendarStore = useCalendarStore()
const { selectedDate } = storeToRefs(calendarStore)

const { getCalendarCells, getWeekDays } = useCalendarCells()
const { calculateEventPositions } = useEventGrouping()

const cells = computed(() => getCalendarCells(selectedDate.value))
const weekDays = computed(() => getWeekDays(selectedDate.value))
const eventPositions = computed(() => calculateEventPositions(props.events, selectedDate.value))

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

	const newDate =
		direction === "left"
			? navigateDate(selectedDate.value, "month", "next")
			: navigateDate(selectedDate.value, "month", "previous")

	dateKey.value = newDate.toISOString()
	calendarStore.setSelectedDate(newDate)

	setTimeout(() => {
		isAnimating.value = false
		swipeDirection.value = null
	}, 250)
}

const slideVariants = {
	enter: (custom: unknown) => {
		const direction = custom as "left" | "right"
		return {
			x: direction === "left" ? "100%" : "-100%",
			transition: { duration: 0.25 },
		}
	},
	center: {
		x: "0%",
		transition: { duration: 0.25 },
	},
	exit: (custom: unknown) => {
		const direction = custom as "left" | "right"
		return {
			x: direction === "left" ? "-100%" : "100%",
			transition: { duration: 0.25 },
		}
	},
}

watch(isSwiping, (swiping) => {
	if (swiping && !isAnimating.value) {
		if (direction.value === "right") {
			handleSwipe("right")
		}
		if (direction.value === "left") {
			handleSwipe("left")
		}
	}
})
</script>

<template>
	<div class="flex h-full flex-col">
		<div class="mb-1 grid flex-shrink-0 grid-cols-7 gap-1">
			<div
				v-for="day in weekDays"
				:key="day"
				class="bg-muted/50 text-muted-foreground flex items-center justify-center py-2 text-xs font-medium
					md:first:rounded-tl-2xl md:last:rounded-tr-2xl"
			>
				{{ day }}
			</div>
		</div>

		<div ref="monthViewContainer" class="relative min-h-0 flex-1 overflow-hidden rounded-b-2xl">
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
							? {
									zIndex: 10 + animationCounter,
									gridTemplateRows: `repeat(${weeksCount}, 1fr)`,
								}
							: {
									gridTemplateRows: `repeat(${weeksCount}, 1fr)`,
								}
					"
					:custom="swipeDirection"
					:variants="slideVariants"
					:initial="isAnimating ? 'enter' : false"
					:animate="'center'"
					:exit="'exit'"
				>
					<BigCalendarDayCell
						v-for="(cell, index) in cells"
						:key="index"
						:cell="cell"
						:events="events"
						:event-positions="eventPositions"
						class="min-h-0"
					/>
				</motion.div>
			</AnimatePresence>
		</div>
	</div>
</template>
