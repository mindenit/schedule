<script setup lang="ts">
import { addDays, subDays, isToday } from "date-fns"
import { formatInTimeZone } from "date-fns-tz"
import { storeToRefs } from "pinia"
import { motion, AnimatePresence } from "motion-v"
import type { TEventType } from "~/types/calendar"

const scheduleStore = useScheduleStore()
const { selectedSchedule } = storeToRefs(scheduleStore)
const { formatTime, formatDate } = useEventFormatting()
const { effectiveTimezone } = useTimezone()

// Dev-only date override — lets you navigate days to test sidebar event rendering.
// Always starts at today; tree-shaken out in production builds.
const previewDate = ref(new Date())
const isDev = import.meta.dev
const isPreviewToday = computed(() => isToday(previewDate.value))

const formattedDate = computed(() => {
	const day = capitalize(formatDate(previewDate.value, "EEEE"))
	const date = formatDate(previewDate.value, "d MMMM")
	return `${day}, ${date}`
})

// Own query pinned to today's academic year — independent of the calendar's
// navigation date. TanStack dedupes when the user is in the same academic year
// (zero extra requests); diverges only when they navigate to a different year.
const scheduleId = computed(() => selectedSchedule.value?.id)
const todayRange = getAcademicYearRange(new Date())
const todayStart = computed(() => {
	if (!selectedSchedule.value) return undefined
	return Math.floor(todayRange.start.getTime() / 1000)
})
const todayEnd = computed(() => {
	if (!selectedSchedule.value) return undefined
	return Math.floor(todayRange.end.getTime() / 1000)
})

const { data: todayRangeEvents, isLoading } = useScheduleQuery(scheduleId, todayStart, todayEnd)

// Filter the year-range events down to just previewDate — no extra network request.
// dayKey drives the outer AnimatePresence key so changing date triggers a full
// wait-mode swap: old list exits, then new list enters (no stacking).
const dayKey = computed(() =>
	formatInTimeZone(previewDate.value, effectiveTimezone.value, "yyyy-MM-dd")
)
const todayEvents = computed(() => {
	if (!todayRangeEvents.value) return []
	const tz = effectiveTimezone.value
	return todayRangeEvents.value.filter(
		(e) => formatInTimeZone(new Date(e.startedAt * 1000), tz, "yyyy-MM-dd") === dayKey.value
	)
})

const hasActiveSchedule = computed(() => !!selectedSchedule.value)
const hasEvents = computed(() => todayEvents.value.length > 0)
</script>

<template>
	<div class="flex min-h-0 flex-1 flex-col gap-4">
		<ClientOnly>
			<div class="flex items-center gap-1">
				<span class="flex-1 text-base font-semibold">{{ formattedDate }}</span>
				<template v-if="isDev">
					<UiButton
						size="icon"
						variant="ghost"
						class="size-6"
						aria-label="Попередній день"
						@click="previewDate = subDays(previewDate, 1)"
					>
						<AppIcon name="ph:caret-left-bold" size="xs" />
					</UiButton>
					<UiButton
						v-if="!isPreviewToday"
						size="icon"
						variant="ghost"
						class="size-6"
						aria-label="Сьогодні"
						@click="previewDate = new Date()"
					>
						<AppIcon name="ph:arrow-counter-clockwise-bold" size="xs" />
					</UiButton>
					<UiButton
						size="icon"
						variant="ghost"
						class="size-6"
						aria-label="Наступний день"
						@click="previewDate = addDays(previewDate, 1)"
					>
						<AppIcon name="ph:caret-right-bold" size="xs" />
					</UiButton>
				</template>
			</div>
			<template #fallback>
				<UiSkeleton class="h-6 w-40 rounded" />
			</template>
		</ClientOnly>

		<ClientOnly>
			<template #fallback>
				<div class="flex flex-col gap-3">
					<UiSkeleton v-for="i in 3" :key="i" class="h-16 w-full rounded-md" />
				</div>
			</template>
			<div class="flex min-h-0 flex-1 flex-col overflow-hidden">
				<!-- Loading skeleton while today's query is in-flight -->
				<div v-if="isLoading" class="flex flex-col gap-3">
					<UiSkeleton v-for="i in 3" :key="i" class="h-16 w-full rounded-md" />
				</div>
				<UiScrollArea v-else class="min-h-0 flex-1">
					<AnimatePresence mode="wait">
						<!-- Event list state — keyed by dayKey so the outer mode="wait" triggers
						     a full sequential swap: old list exits completely, then new list enters.
						     No inner AnimatePresence needed; per-card stagger on enter is enough. -->
						<motion.div
							v-if="hasActiveSchedule && hasEvents"
							:key="`event-list-${dayKey}`"
							:initial="{ opacity: 0, y: 6 }"
							:animate="{ opacity: 1, y: 0 }"
							:exit="{ opacity: 0, y: -6 }"
							:transition="{ duration: 0.18 }"
						>
							<div class="flex flex-col gap-3">
								<motion.div
									v-for="(event, index) in todayEvents"
									:key="event.id"
									:initial="{ opacity: 0, y: 10 }"
									:animate="{ opacity: 1, y: 0 }"
									:transition="{
										duration: 0.2,
										delay: Math.min(index * 0.05, 0.2),
									}"
								>
									<SidebarEvent
										:start-time="formatTime(event.startedAt)"
										:end-time="formatTime(event.endedAt)"
										:auditorium="event.auditorium?.name ?? 'Не вказана'"
										:type="event.type as TEventType"
										:name="event.subject.title"
									/>
								</motion.div>
							</div>
						</motion.div>

						<!-- No events state -->
						<motion.div
							v-else-if="hasActiveSchedule && !hasEvents"
							key="no-events"
							:initial="{ opacity: 0, y: 6 }"
							:animate="{ opacity: 1, y: 0 }"
							:exit="{ opacity: 0, y: -6 }"
							:transition="{ duration: 0.18 }"
						>
							<AppEmptyState
								variant="sidebar"
								icon="ph:smiley-bold"
								title="Пар на сьогодні немає"
							/>
						</motion.div>

						<!-- No schedule state -->
						<motion.div
							v-else
							key="no-schedule"
							:initial="{ opacity: 0, y: 6 }"
							:animate="{ opacity: 1, y: 0 }"
							:exit="{ opacity: 0, y: -6 }"
							:transition="{ duration: 0.18 }"
						>
							<AppEmptyState
								variant="sidebar"
								icon="ph:calendar-plus-bold"
								title="Оберіть розклад для перегляду пар"
							/>
						</motion.div>
					</AnimatePresence>
				</UiScrollArea>
			</div>
		</ClientOnly>
	</div>
</template>
