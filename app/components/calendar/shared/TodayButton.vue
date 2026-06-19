<script setup lang="ts">
import { storeToRefs } from "pinia"

const calendarStore = useCalendarStore()
const { view } = storeToRefs(calendarStore)
const { trackEvent } = useAnalytics()
const today = new Date()
function handleClick() {
	calendarStore.setSelectedDate(today)
	trackEvent("date_navigated", { direction: "today", view: view.value, source: "button" })
}
</script>

<template>
	<UiButton variant="outline" size="icon" class="md:hidden" @click="handleClick">
		<AppIcon name="lucide:calendar-days" />
	</UiButton>

	<UiButton variant="outline" class="max-md:hidden" @click="handleClick"> Сьогодні </UiButton>
</template>
