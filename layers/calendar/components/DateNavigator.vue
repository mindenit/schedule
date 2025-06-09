<script setup lang="ts">
import { formatDate } from "date-fns"
import { uk } from "date-fns/locale"

const calendarStore = useCalendarStore()
const { selectedDate, view } = storeToRefs(calendarStore)

const title = computed(() => {
	if (view.value === "year") {
		return formatDate(selectedDate.value, "yyyy рік")
	}

	const formatted = formatDate(selectedDate.value, "LLLL yyyy", { locale: uk })
	return formatted.charAt(0).toUpperCase() + formatted.slice(1)
})

const currentRangeText = computed(() => {
	return rangeText(view.value, selectedDate.value)
})

function handlePrevious() {
	const newDate = navigateDate(selectedDate.value, view.value, "previous")
	calendarStore.setSelectedDate(newDate)
}

function handleNext() {
	const newDate = navigateDate(selectedDate.value, view.value, "next")
	calendarStore.setSelectedDate(newDate)
}

console.log(currentRangeText.value)
</script>

<template>
	<div class="flex items-center gap-4">
		<span class="text-lg font-semibold"> {{ title }} </span>

		<div class="flex items-center gap-1">
			<Button variant="secondary" size="icon" @click="handlePrevious">
				<Icon name="lucide:chevron-left" />
			</Button>

			<CalendarTodayButton />

			<Button variant="secondary" size="icon" @click="handleNext">
				<Icon name="lucide:chevron-right" />
			</Button>
		</div>
	</div>
</template>
