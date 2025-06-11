<script setup lang="ts">
import { formatDate } from "date-fns"
import { uk } from "date-fns/locale"

const calendarStore = useCalendarStore()
const { selectedDate, view } = storeToRefs(calendarStore)

const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1)

const viewConfigs: Record<string, { format: string; capitalize: boolean }> = {
	year: { format: "yyyy рік", capitalize: false },
	month: { format: "LLLL yyyy", capitalize: true },
	day: { format: "d MMMM yyyy", capitalize: true },
	default: { format: "LLLL yyyy", capitalize: true },
}

const title = computed(() => {
	const config = viewConfigs[view.value as string] ?? viewConfigs.default
	if (!config) return ""
	const formatted = formatDate(selectedDate.value, config.format, { locale: uk })

	return config.capitalize ? capitalize(formatted) : formatted
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
