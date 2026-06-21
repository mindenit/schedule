<script setup lang="ts">
import { storeToRefs } from "pinia"
import { format, isSameDay } from "date-fns"
import { uk } from "date-fns/locale"
import type { Schedule } from "nurekit"
import { motion, animate, useMotionValue, type AnimationPlaybackControls } from "motion-v"
import { CALENDAR_HOURS } from "~/constants/calendar"
import { SWIPE_SPRING_TRANSITION } from "~/constants"

interface Props {
	events: Schedule[]
}

const props = defineProps<Props>()

const calendarStore = useCalendarStore()
const { selectedDate } = storeToRefs(calendarStore)

const { getWeekDaysDetailed } = useCalendarCells()
const { getEventsForDate, groupEvents } = useEventGrouping()
const { formatHour, capitalize } = useEventFormatting()
const { effectiveTimezone } = useTimezone()

const hours = CALENDAR_HOURS

// ---------------------------------------------------------------------------
// Panel snapshots — each panel owns its week days and grouped events,
// frozen at navigation time so the exiting panel doesn't go blank.
// ---------------------------------------------------------------------------
interface WeekPanel {
	weekStart: Date
	weekDays: Date[]
	groupedEventsByDay: Schedule[][][]
}

function buildPanel(date: Date): WeekPanel {
	const weekDays = getWeekDaysDetailed(date)
	return {
		weekStart: weekDays[0],
		weekDays,
		groupedEventsByDay: weekDays.map((day) =>
			groupEvents(getEventsForDate(props.events, day, effectiveTimezone.value))
		),
	}
}

const currentPanel = ref<WeekPanel>(buildPanel(selectedDate.value))
const incomingPanel = ref<WeekPanel | null>(null)

const hasEvents = computed(() =>
	currentPanel.value.groupedEventsByDay.some((dayGroups) => dayGroups.some((g) => g.length > 0))
)

// ---------------------------------------------------------------------------
// Motion values
// ---------------------------------------------------------------------------
const currentX = useMotionValue(0)
const incomingX = useMotionValue(0)

// ---------------------------------------------------------------------------
// Navigation core
// ---------------------------------------------------------------------------
const weekRootEl = useTemplateRef("weekRoot")
const isNavigating = ref(false)
let inflightControls: AnimationPlaybackControls[] = []

function getWidth(): number {
	return weekRootEl.value?.clientWidth ?? 800
}

function cancelInflight() {
	inflightControls.forEach((c) => c.stop())
	inflightControls = []
}

async function navigateTo(dir: "left" | "right", newDate: Date, source: string) {
	cancelInflight()
	isNavigating.value = true

	const incoming = buildPanel(newDate)
	incomingPanel.value = incoming

	const w = getWidth()
	incomingX.set(dir === "left" ? w : -w)

	calendarStore.setSelectedDate(newDate)

	const exitX = dir === "left" ? -w : w
	const controls = [
		animate(currentX, exitX, SWIPE_SPRING_TRANSITION),
		animate(incomingX, 0, SWIPE_SPRING_TRANSITION),
	]
	inflightControls = controls
	await Promise.all(controls)

	if (inflightControls !== controls) return

	isNavigating.value = false
	currentPanel.value = incoming
	incomingPanel.value = null
	currentX.set(0)
	incomingX.set(0)

	trackEvent("date_navigated", {
		direction: dir === "left" ? "next" : "prev",
		view: "week",
		source,
	})
}

// ---------------------------------------------------------------------------
// External date changes (button, keyboard, today button, mini-calendar)
// ---------------------------------------------------------------------------
const { trackEvent } = useAnalytics()

watch(selectedDate, (newDate) => {
	if (isNavigating.value && incomingPanel.value?.weekStart.getTime() === getWeekDaysDetailed(newDate)[0].getTime()) return
	// Same calendar week — nothing to animate.
	if (newDate >= currentPanel.value.weekStart && newDate < new Date(currentPanel.value.weekStart.getTime() + 7 * 86400000)) return
	const dir: "left" | "right" = newDate >= currentPanel.value.weekStart ? "left" : "right"
	navigateTo(dir, newDate, "external")
})

// ---------------------------------------------------------------------------
// Rebuild current panel when events prop changes (new schedule loaded)
// ---------------------------------------------------------------------------
watch(
	() => props.events,
	() => {
		if (!isNavigating.value) {
			currentPanel.value = buildPanel(selectedDate.value)
		}
	}
)
</script>

<template>
	<div ref="weekRoot" class="relative flex h-full flex-col">
		<div class="relative flex flex-1 overflow-hidden">
			<!-- Incoming panel -->
			<motion.div
				v-if="incomingPanel"
				class="absolute inset-0 flex flex-col overflow-x-auto"
				:style="{ x: incomingX }"
			>
				<div class="flex min-w-[800px] flex-1 flex-col">
					<div class="bg-muted/50 relative z-20 mb-1 grid grid-cols-[72px_1fr] gap-1 md:rounded-t-lg">
						<div class="col-start-2 grid grid-cols-7 gap-1">
							<span
								v-for="(day, index) in incomingPanel.weekDays"
								:key="index"
								class="text-muted-foreground flex min-w-[100px] flex-col items-center gap-1 py-2
									text-center text-xs font-medium"
							>
								<span class="hidden sm:block">
									{{ capitalize(format(day, "EEEE", { locale: uk })) }}
								</span>
								<span class="block sm:hidden">
									{{ capitalize(format(day, "EEE", { locale: uk })) }}
								</span>
								<span
									class="text-md flex size-5 items-center justify-center rounded-full font-semibold"
									:class="{ 'bg-primary text-foreground': isSameDay(day, new Date()) }"
								>
									{{ format(day, "d") }}
								</span>
							</span>
						</div>
					</div>

					<div class="grid min-h-0 flex-1 grid-cols-[72px_1fr] gap-1">
						<div class="relative flex flex-col">
							<div
								v-for="(hour, index) in hours"
								:key="hour"
								class="bg-muted/50 relative flex-1"
								:class="{ 'rounded-bl-lg': index === hours.length - 1 }"
							>
								<div class="absolute -top-3 right-2 flex h-6 items-center">
									<span v-if="index !== 0" class="text-muted-foreground text-xs whitespace-nowrap">
										{{ formatHour(hour) }}
									</span>
								</div>
							</div>
						</div>

						<div class="relative min-h-0 flex-1">
							<div class="grid h-full grid-cols-7 gap-1">
								<div
									v-for="(day, dayIndex) in incomingPanel.weekDays"
									:key="day.getTime()"
									class="relative min-w-[100px]"
								>
									<div class="flex h-full flex-col gap-1">
										<div
											v-for="(hour, hourIndex) in hours"
											:key="hour"
											class="bg-card relative flex-1"
											:class="{
												'rounded-br-lg':
													dayIndex === incomingPanel.weekDays.length - 1 &&
													hourIndex === hours.length - 1,
											}"
										></div>
									</div>
									<BigCalendarEventRenderer
										:grouped-events="incomingPanel.groupedEventsByDay[dayIndex]"
										:day="day"
										:tz="effectiveTimezone"
									/>
								</div>
							</div>
						</div>
					</div>
				</div>
			</motion.div>

			<!-- Current panel -->
			<motion.div
				class="absolute inset-0 flex flex-col overflow-x-auto"
				:class="{ 'blur-sm': !hasEvents }"
				:style="{ x: currentX }"
			>
				<div class="flex min-w-[800px] flex-1 flex-col">
					<div class="bg-muted/50 relative z-20 mb-1 grid grid-cols-[72px_1fr] gap-1 md:rounded-t-lg">
						<div class="col-start-2 grid grid-cols-7 gap-1">
							<span
								v-for="(day, index) in currentPanel.weekDays"
								:key="index"
								class="text-muted-foreground flex min-w-[100px] flex-col items-center gap-1 py-2
									text-center text-xs font-medium transition-all duration-200"
							>
								<span class="hidden sm:block">
									{{ capitalize(format(day, "EEEE", { locale: uk })) }}
								</span>
								<span class="block sm:hidden">
									{{ capitalize(format(day, "EEE", { locale: uk })) }}
								</span>
								<span
									class="text-md flex size-5 items-center justify-center rounded-full font-semibold"
									:class="{ 'bg-primary text-foreground': isSameDay(day, new Date()) }"
								>
									{{ format(day, "d") }}
								</span>
							</span>
						</div>
					</div>

					<div class="grid min-h-0 flex-1 grid-cols-[72px_1fr] gap-1">
						<div class="relative flex flex-col">
							<div
								v-for="(hour, index) in hours"
								:key="hour"
								class="bg-muted/50 relative flex-1"
								:class="{ 'rounded-bl-lg': index === hours.length - 1 }"
							>
								<div class="absolute -top-3 right-2 flex h-6 items-center">
									<span v-if="index !== 0" class="text-muted-foreground text-xs whitespace-nowrap">
										{{ formatHour(hour) }}
									</span>
								</div>
							</div>
						</div>

						<div class="relative min-h-0 flex-1">
							<div class="grid h-full grid-cols-7 gap-1">
								<div
									v-for="(day, dayIndex) in currentPanel.weekDays"
									:key="day.getTime()"
									class="relative min-w-[100px]"
								>
									<div class="flex h-full flex-col gap-1">
										<div
											v-for="(hour, hourIndex) in hours"
											:key="hour"
											class="bg-card relative flex-1"
											:class="{
												'rounded-br-lg':
													dayIndex === currentPanel.weekDays.length - 1 &&
													hourIndex === hours.length - 1,
											}"
										></div>
									</div>
									<BigCalendarEventRenderer
										:grouped-events="currentPanel.groupedEventsByDay[dayIndex]"
										:day="day"
										:tz="effectiveTimezone"
									/>
								</div>
							</div>
							<BigCalendarTimeline :week-days="currentPanel.weekDays" />
						</div>
					</div>
				</div>
			</motion.div>
		</div>

		<BigCalendarEmptyStateOverlay
			:show="!hasEvents"
			description="У цьому тижні немає запланованих пар"
		/>
	</div>
</template>
