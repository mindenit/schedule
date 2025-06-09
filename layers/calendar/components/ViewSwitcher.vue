<script setup lang="ts">
import { storeToRefs } from "pinia"

import type { TCalendarView } from "../types"

const calendarStore = useCalendarStore()
const { view } = storeToRefs(calendarStore)

const viewOptions = [
	{ value: "day", label: "День" },
	{ value: "week", label: "Тиждень" },
	{ value: "month", label: "Місяць" },
	{ value: "year", label: "Рік" },
	{ value: "agenda", label: "Агенда" },
]

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
			<SelectItem v-for="option in viewOptions" :key="option.value" :value="option.value">
				{{ option.label }}
			</SelectItem>
		</SelectContent>
	</Select>
</template>
