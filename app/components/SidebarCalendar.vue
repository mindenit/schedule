<script setup lang="ts">
import type { CalendarDay } from "v-calendar/dist/types/src/utils/page"

const calendarStore = useCalendarStore()
const { trackEvent } = useAnalytics()

const onDayClick = (day: CalendarDay) => {
	calendarStore.setView("day")
	calendarStore.setSelectedDate(day.date)
	trackEvent("view_changed", { view: "day", source: "sidebar_calendar" })
}

const selectedAttributes = computed(() => [
	{
		key: "selected",
		highlight: { color: "purple", fillMode: "solid" },
		dates: calendarStore.selectedDate,
	},
])

const initialPage = computed(() => ({
	month: calendarStore.selectedDate.getMonth() + 1,
	year: calendarStore.selectedDate.getFullYear(),
}))

const calendarEl = useTemplateRef<HTMLElement>("calendarEl")

function labelVCalendarNavButtons(root: HTMLElement) {
	const prev = root.querySelector<HTMLElement>(".vc-prev")
	const next = root.querySelector<HTMLElement>(".vc-next")
	if (prev && !prev.getAttribute("aria-label")) prev.setAttribute("aria-label", "Попередній місяць")
	if (next && !next.getAttribute("aria-label")) next.setAttribute("aria-label", "Наступний місяць")
}

onMounted(() => {
	const root = calendarEl.value
	if (!root) return

	labelVCalendarNavButtons(root)

	const observer = new MutationObserver(() => labelVCalendarNavButtons(root))
	observer.observe(root, { childList: true, subtree: true })

	onUnmounted(() => observer.disconnect())
})
</script>

<template>
	<ClientOnly>
		<div ref="calendarEl">
		<UiCalendar
			expanded
			locale="uk"
			class="sidebar-calendar bg-card rounded-md"
			:attributes="selectedAttributes"
			:initial-page="initialPage"
			@dayclick="onDayClick"
		/>
		</div>
		<template #fallback>
			<UiSkeleton class="h-[286px] w-[280px] rounded-md" />
		</template>
	</ClientOnly>
</template>

<style>
.sidebar-calendar.vc-container {
	width: 100% !important;
}
</style>
