<script setup lang="ts">
import { storeToRefs } from "pinia"
import type { TCalendarView } from "~/types/calendar"
import { VIEW_OPTIONS } from "~/constants/calendar"

const calendarStore = useCalendarStore()
const { view } = storeToRefs(calendarStore)

function updateView(newView: unknown) {
	if (typeof newView === "string" && newView) {
		calendarStore.setView(newView as TCalendarView)
	}
}
</script>

<template>
	<Select :model-value="view" @update:model-value="updateView">
		<SelectTrigger class="max-md:w-full">
			<SelectValue placeholder="Обрати вигляд" />
		</SelectTrigger>
		<SelectContent>
			<SelectItem v-for="option in VIEW_OPTIONS" :key="option.value" :value="option.value">
				{{ option.label }}
			</SelectItem>
		</SelectContent>
	</Select>
</template>
