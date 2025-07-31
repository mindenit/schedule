<script setup lang="ts">
import { storeToRefs } from "pinia"
import { format, isSameDay } from "date-fns"
import { uk } from "date-fns/locale"
import type { Schedule } from "nurekit"

interface Props {
	events: Schedule[]
}

const props = defineProps<Props>()

const calendarStore = useCalendarStore()
const { selectedDate } = storeToRefs(calendarStore)

const { getWeekDaysDetailed } = useCalendarCells()
const { getEventsForDate, groupEvents } = useEventGrouping()
const { formatHour, capitalize } = useEventFormatting()

const weekDays = computed(() => getWeekDaysDetailed(selectedDate.value))
const hours = Array.from({ length: 24 }, (_, i) => i)

const getDayEvents = (day: Date) => getEventsForDate(props.events, day)
const getGroupedEventsForDay = (day: Date) => groupEvents(getDayEvents(day))

const weekViewEl = useTemplateRef("weekView")

const getEarliestEventOfWeek = () => {
	let earliestEvent: Schedule | null = null

	const allWeekEvents: Schedule[] = []

	for (const day of weekDays.value) {
		const dayEvents = getDayEvents(day)
		allWeekEvents.push(...dayEvents)
	}

	if (allWeekEvents.length === 0) {
		return null
	}

	earliestEvent = allWeekEvents.reduce((earliest, current) => {
		const currentStart = parseDate(current.startedAt)
		const earliestStart = parseDate(earliest.startedAt)

		const currentTime = currentStart.getHours() * 60 + currentStart.getMinutes()
		const earliestTime = earliestStart.getHours() * 60 + earliestStart.getMinutes()

		return currentTime < earliestTime ? current : earliest
	})

	return earliestEvent
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
	const firstEvent = getEarliestEventOfWeek()
	if (!firstEvent) {
		return false
	}

	const scrollContainer = findScrollableParent(weekViewEl.value)

	if (!scrollContainer) {
		return false
	}

	const eventStart = parseDate(firstEvent.startedAt)
	const hour = eventStart.getHours()
	const minutes = eventStart.getMinutes()

	const rowHeight = typeof WEEK_VIEW_ROW_HEIGHT !== "undefined" ? WEEK_VIEW_ROW_HEIGHT : 60
	const scrollPosition = hour * rowHeight + (minutes / 60) * rowHeight - 100

	scrollContainer.scrollTo({
		top: Math.max(0, scrollPosition),
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

watch([selectedDate, () => props.events], scheduleScroll, { immediate: true })

onMounted(() => {
	setTimeout(() => {
		scrollToFirstEvent()
	}, 500)
})
</script>

<template>
	<div ref="weekView" class="flex flex-col">
		<div class="overflow-x-auto">
			<div class="min-w-[800px]">
				<div class="bg-muted/50 relative z-20 mb-1 grid grid-cols-[72px_1fr] gap-1 md:rounded-t-lg">
					<div class="col-start-2 grid grid-cols-7 gap-1">
						<span
							v-for="(day, index) in weekDays"
							:key="index"
							class="text-muted-foreground flex min-w-[100px] flex-col items-center gap-1 py-2 text-center text-xs
								font-medium transition-all duration-200"
						>
							<span class="hidden sm:block">
								{{ capitalize(format(day, "EEEE", { locale: uk })) }}
							</span>
							<span class="block sm:hidden">
								{{ capitalize(format(day, "EEE", { locale: uk })) }}
							</span>
							<span
								class="text-md flex size-5 items-center justify-center rounded-full font-semibold"
								:class="{
									'bg-primary text-foreground': isSameDay(day, new Date()),
								}"
							>
								{{ format(day, "d") }}
							</span>
						</span>
					</div>
				</div>

				<div class="grid grid-cols-[72px_1fr] gap-1">
					<div class="relative">
						<div
							v-for="(hour, index) in hours"
							:key="hour"
							class="bg-muted/50 relative"
							:style="{ height: WEEK_VIEW_ROW_HEIGHT + 'px' }"
							:class="{
								'rounded-bl-lg': index === hours.length - 1,
							}"
						>
							<div class="absolute -top-3 right-2 flex h-6 items-center">
								<span v-if="index !== 0" class="text-muted-foreground text-xs whitespace-nowrap">
									{{ formatHour(hour) }}
								</span>
							</div>
						</div>
					</div>

					<div class="relative">
						<div class="grid h-full grid-cols-7 gap-1">
							<div
								v-for="(day, dayIndex) in weekDays"
								:key="day.getTime()"
								class="relative min-w-[100px]"
							>
								<div class="grid h-full grid-rows-24 gap-1">
									<div
										v-for="(hour, hourIndex) in hours"
										:key="hour"
										class="bg-card relative"
										:class="{
											'rounded-br-lg':
												dayIndex === weekDays.length - 1 && hourIndex === hours.length - 1,
										}"
									></div>
								</div>
								<BigCalendarEventRenderer
									:grouped-events="getGroupedEventsForDay(day)"
									:day="day"
								/>
							</div>
						</div>
						<BigCalendarTimeline :week-days="weekDays" />
					</div>
				</div>
			</div>
		</div>
	</div>
</template>
