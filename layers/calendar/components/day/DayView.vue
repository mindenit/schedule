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

const { getEventsForDate, groupEvents } = useEventGrouping()
const { formatHour } = useEventFormatting()

const isToday = computed(() => {
	return selectedDate.value.toDateString() === new Date().toDateString()
})

const hours = CALENDAR_HOURS

const dayEvents = computed(() => getEventsForDate(props.events, selectedDate.value))
const groupedEvents = computed(() => groupEvents(dayEvents.value))

const hasEvents = computed(() => dayEvents.value.length > 0)

const dayViewEl = useTemplateRef("dayView")
const { direction, isSwiping } = useSwipe(dayViewEl)

const isAnimating = ref(false)
const swipeDirection = ref<"left" | "right" | null>(null)
const dateKey = ref(CalendarAnimationUtils.createDateKey(selectedDate.value))
const animationCounter = ref(0)

const handleSwipe = (direction: "left" | "right") => {
	isAnimating.value = true
	swipeDirection.value = direction
	animationCounter.value++

	const newDate =
		direction === "left"
			? navigateDate(selectedDate.value, "day", "next")
			: navigateDate(selectedDate.value, "day", "previous")

	dateKey.value = CalendarAnimationUtils.createDateKey(newDate)
	calendarStore.setSelectedDate(newDate)

	setTimeout(() => {
		isAnimating.value = false
		swipeDirection.value = null
	}, SWIPE_ANIMATION_CONFIG.duration)
}

const slideVariants = SWIPE_ANIMATION_CONFIG.variants

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
	<div ref="dayView" class="relative flex h-full rounded-lg">
		<div class="relative flex flex-1 flex-col">
			<AnimatePresence :initial="false" :custom="swipeDirection">
				<motion.div
					:key="dateKey"
					:class="[
						isAnimating ? 'absolute inset-0 flex flex-1 flex-col' : 'flex flex-1 flex-col',
						{ 'blur-sm': !hasEvents },
					]"
					:style="isAnimating ? { zIndex: 10 + animationCounter } : {}"
					:custom="swipeDirection"
					:variants="slideVariants"
					:transition="SWIPE_ANIMATION_TRANSITION"
					:initial="isAnimating ? 'enter' : false"
					:animate="'center'"
					:exit="'exit'"
				>
					<div class="flex min-h-0 flex-1 gap-1">
						<div class="relative flex w-18 flex-shrink-0 flex-col">
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
						<div class="relative flex-1">
							<div class="flex h-full flex-col gap-1">
								<div v-for="hour in hours" :key="hour" class="bg-card relative flex-1"></div>
							</div>
							<div class="absolute inset-0">
								<BigCalendarEventRenderer :grouped-events="groupedEvents" :day="selectedDate" />
							</div>
							<BigCalendarTimeline v-if="isToday" />
						</div>
					</div>
				</motion.div>
			</AnimatePresence>
		</div>

		<BigCalendarEmptyStateOverlay
			:show="!hasEvents"
			description="У цей день немає заплнованих пар"
		/>
	</div>
</template>
