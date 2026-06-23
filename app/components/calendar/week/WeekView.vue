<script setup lang="ts">
import { format, isSameDay, isSameWeek } from "date-fns"
import { uk } from "date-fns/locale"
import type { Schedule } from "nurekit"
import { motion } from "motion-v"
import { CALENDAR_HOURS, WEEK_OPTIONS } from "~/constants/calendar"

interface Props {
	events: Schedule[]
}

const props = defineProps<Props>()

const { getWeekDaysDetailed } = useCalendarCells()

const { formatHour } = useEventFormatting()
const { effectiveTimezone } = useTimezone()

const hours = CALENDAR_HOURS

interface WeekPanel {
	/** Same as weekStart — kept under this name for SwipeablePanel compatibility. */
	date: Date
	weekStart: Date
	weekDays: Date[]
	groupedEventsByDay: Schedule[][][]
}

function buildPanel(seedDate: Date): WeekPanel {
	const weekDays = getWeekDaysDetailed(seedDate)
	const weekStart = weekDays[0]!
	return {
		date: weekStart,
		weekStart,
		weekDays,
		groupedEventsByDay: weekDays.map((day) =>
			groupEvents(getEventsForDate(props.events, day, effectiveTimezone.value))
		),
	}
}

const weekRootEl = useTemplateRef("weekRoot")

const { currentPanel, incomingPanel, currentX, incomingX } = useSwipeNavigator<WeekPanel>({
	view: "week",
	containerRef: weekRootEl,
	buildPanel,
	samePeriod: (a, b) => isSameWeek(a, b, WEEK_OPTIONS),
	events: () => props.events,
	timezone: () => effectiveTimezone.value,
	fallbackWidth: 800,
	dragEnabled: false,
})

const hasEvents = computed(() =>
	currentPanel.value.groupedEventsByDay.some((dayGroups) => dayGroups.some((g) => g.length > 0))
)

// Avoid hydration mismatch: new Date() diverges between SSR and client.
// null on server → no "today" highlight; real Date after mount.
const clientToday = ref<Date | null>(null)
onMounted(() => {
	clientToday.value = new Date()
})
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
									:class="{ 'bg-primary text-foreground': clientToday && isSameDay(day, clientToday) }"
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

			<!-- Current panel (swipe disabled for week view) -->
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
									:class="{ 'bg-primary text-foreground': clientToday && isSameDay(day, clientToday) }"
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
