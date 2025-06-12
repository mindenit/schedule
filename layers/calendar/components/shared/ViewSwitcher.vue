<script setup lang="ts">
import { storeToRefs } from "pinia"

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
		<SelectTrigger>
			<SelectValue placeholder="Обрати вигляд" />
		</SelectTrigger>
		<SelectContent>
			<SelectItem v-for="option in VIEW_OPTIONS" :key="option.value" :value="option.value">
				{{ option.label }}
			</SelectItem>
		</SelectContent>
	</Select>
</template>
