<script setup lang="ts">
import { storeToRefs } from "pinia"
import { format } from "date-fns"
import { uk } from "date-fns/locale"
import { VIEW_CONFIGS } from "~/constants/calendar"

const calendarStore = useCalendarStore()
const { selectedDate, view } = storeToRefs(calendarStore)
const { trackEvent } = useAnalytics()

// `capitalize` is auto-imported from `~/utils/strings`.

const title = computed(() => {
	const config = VIEW_CONFIGS[view.value as string] ?? VIEW_CONFIGS.default
	if (!config) return ""

	const dateToFormat =
		selectedDate.value instanceof Date ? selectedDate.value : new Date(selectedDate.value)

	const formatted = format(dateToFormat, config.format, { locale: uk })
	return config.capitalize ? capitalize(formatted) : formatted
})

function handlePrevious() {
	const newDate = navigateDate(selectedDate.value, view.value, "previous")
	// Set direction before date so views can read it on the same tick.
	calendarStore.setNavigationDirection("right")
	calendarStore.setSelectedDate(newDate)
	trackEvent("date_navigated", { direction: "prev", view: view.value, source: "button" })
}

function handleNext() {
	const newDate = navigateDate(selectedDate.value, view.value, "next")
	// Set direction before date so views can read it on the same tick.
	calendarStore.setNavigationDirection("left")
	calendarStore.setSelectedDate(newDate)
	trackEvent("date_navigated", { direction: "next", view: view.value, source: "button" })
}
</script>

<template>
	<div class="flex items-center gap-4">
		<span class="text-base font-semibold whitespace-nowrap md:text-lg"> {{ title }} </span>

		<div class="flex items-center gap-1">
			<UiButton variant="outline" size="icon" aria-label="Попередній" @click="handlePrevious">
				<AppIcon name="lucide:chevron-left" />
			</UiButton>

			<BigCalendarTodayButton />

			<UiButton variant="outline" size="icon" aria-label="Наступний" @click="handleNext">
				<AppIcon name="lucide:chevron-right" />
			</UiButton>
		</div>
	</div>
</template>
