<script setup lang="ts">
import { storeToRefs } from "pinia"
import { formatDate } from "date-fns"
import { uk } from "date-fns/locale"

const calendarStore = useCalendarStore()
const { selectedDate, view } = storeToRefs(calendarStore)

const { capitalize } = useEventFormatting()

const title = computed(() => {
	const config = VIEW_CONFIGS[view.value as string] ?? VIEW_CONFIGS.default
	if (!config) return ""

	const dateToFormat =
		selectedDate.value instanceof Date ? selectedDate.value : new Date(selectedDate.value)

	const formatted = formatDate(dateToFormat, config.format, { locale: uk })
	return config.capitalize ? capitalize(formatted) : formatted
})

function handlePrevious() {
	const newDate = navigateDate(selectedDate.value, view.value, "previous")
	calendarStore.setSelectedDate(newDate)
}

function handleNext() {
	const newDate = navigateDate(selectedDate.value, view.value, "next")
	calendarStore.setSelectedDate(newDate)
}
</script>

<template>
	<div class="flex items-center gap-4">
		<span class="text-base font-semibold whitespace-nowrap md:text-lg"> {{ title }} </span>

		<div class="flex items-center gap-1">
			<Button variant="secondary" size="icon" @click="handlePrevious">
				<AppIcon name="lucide:chevron-left" />
			</Button>

			<BigCalendarTodayButton />

			<Button variant="secondary" size="icon" @click="handleNext">
				<AppIcon name="lucide:chevron-right" />
			</Button>
		</div>
	</div>
</template>
