<script setup lang="ts">
import { storeToRefs } from "pinia"
import type { TCalendarView } from "~/types/calendar"
import { VIEW_OPTIONS } from "~/constants/calendar"

const calendarStore = useCalendarStore()
const { view } = storeToRefs(calendarStore)
const { trackEvent } = useAnalytics()

const viewLabel = computed(
	() => VIEW_OPTIONS.find((o) => o.value === view.value)?.label ?? "Місяць"
)

function updateView(newView: unknown) {
	if (typeof newView === "string" && newView) {
		calendarStore.setView(newView as TCalendarView)
		trackEvent("view_changed", { view: newView as TCalendarView, source: "switcher" })
	}
}
</script>

<template>
	<UiSelect :model-value="view" @update:model-value="updateView">
		<UiSelectTrigger class="w-auto max-md:w-full">
			<UiSelectValue>{{ viewLabel }}</UiSelectValue>
		</UiSelectTrigger>
		<UiSelectContent>
			<UiSelectItem v-for="option in VIEW_OPTIONS" :key="option.value" :value="option.value">
				{{ option.label }}
			</UiSelectItem>
		</UiSelectContent>
	</UiSelect>
</template>
