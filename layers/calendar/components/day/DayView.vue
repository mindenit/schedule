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

const hours = Array.from({ length: 24 }, (_, i) => i)

const dayEvents = computed(() => getEventsForDate(props.events, selectedDate.value))
const groupedEvents = computed(() => groupEvents(dayEvents.value))

const dayViewEl = useTemplateRef("dayView")
const { direction, isSwiping } = useSwipe(dayViewEl)

const isAnimating = ref(false)
const swipeDirection = ref<"left" | "right" | null>(null)
const dateKey = ref(CalendarAnimationUtils.createDateKey(selectedDate.value))
const animationCounter = ref(0)

const getFirstEvent = () => {
	if (!dayEvents.value.length) return null

	return dayEvents.value.reduce((earliest, current) => {
		const currentStart = parseDate(current.startedAt)
		const earliestStart = parseDate(earliest.startedAt)
		return currentStart < earliestStart ? current : earliest
	})
}

const findScrollableParent = (element: HTMLElement | null): HTMLElement | null => {
	if (!element) return null

	const style = window.getComputedStyle(element)
	const hasOverflow = style.overflowY === "auto" || style.overflowY === "scroll"
	const isScrollable = element.scrollHeight > element.clientHeight

	if (hasOverflow && isScrollable) {
		return element
	}

	return findScrollableParent(element.parentElement)
}

const scrollToFirstEvent = () => {
	const firstEvent = getFirstEvent()
	if (!firstEvent) {
		return false
	}

	const scrollContainer = findScrollableParent(dayViewEl.value)

	if (!scrollContainer) {
		return false
	}

	const eventStart = parseDate(firstEvent.startedAt)
	const hour = eventStart.getHours()
	const minutes = eventStart.getMinutes()

	const totalMinutes = 24 * 60
	const eventMinutes = hour * 60 + minutes
	const scrollPercentage = eventMinutes / totalMinutes

	const scrollHeight = scrollContainer.scrollHeight
	const clientHeight = scrollContainer.clientHeight
	const maxScrollTop = scrollHeight - clientHeight

	let scrollPosition = scrollPercentage * scrollHeight - clientHeight * 0.3
	scrollPosition = Math.max(0, Math.min(scrollPosition, maxScrollTop))

	scrollContainer.scrollTo({
		top: scrollPosition,
		behavior: "smooth",
	})

	return true
}

const scheduleScroll = () => {
	nextTick(() => {
		setTimeout(() => {
			scrollToFirstEvent()
		}, 100)
	})
}

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

watch([selectedDate, () => props.events], scheduleScroll, { immediate: true })

onMounted(() => {
	setTimeout(() => {
		scrollToFirstEvent()
	}, 500)
})

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
	<div ref="dayView" class="flex h-full overflow-auto rounded-lg">
		<div class="relative flex flex-1 flex-col overflow-hidden">
			<AnimatePresence :initial="false" :custom="swipeDirection">
				<motion.div
					:key="dateKey"
					:class="
						isAnimating
							? 'absolute inset-0 flex flex-1 flex-col overflow-hidden'
							: 'flex flex-1 flex-col overflow-hidden'
					"
					:style="isAnimating ? { zIndex: 10 + animationCounter } : {}"
					:custom="swipeDirection"
					:variants="slideVariants"
					:transition="SWIPE_ANIMATION_TRANSITION"
					:initial="isAnimating ? 'enter' : false"
					:animate="'center'"
					:exit="'exit'"
				>
					<div class="flex min-h-0 flex-1 gap-1 overflow-hidden">
						<div class="relative flex w-18 flex-shrink-0 flex-col">
							<div
								v-for="(hour, index) in hours"
								:key="hour"
								class="bg-muted/50 relative flex flex-1 items-start justify-end pr-2"
								:style="{ minHeight: `${100 / hours.length}%` }"
							>
								<span v-if="index !== 0" class="text-muted-foreground text-xs">
									{{ formatHour(hour) }}
								</span>
							</div>
						</div>
						<div class="relative flex-1 overflow-hidden">
							<div class="flex h-full flex-col gap-1">
								<div
									v-for="hour in hours"
									:key="hour"
									class="bg-card relative min-h-[52px]"
									:style="{ height: `${(100 - (hours.length - 1) * 0.25) / hours.length}%` }"
								></div>
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
	</div>
</template>
