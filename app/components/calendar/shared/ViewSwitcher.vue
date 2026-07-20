<script setup lang="ts">
import { storeToRefs } from "pinia"
import type { TCalendarView } from "~/types/calendar"
import { VIEW_OPTIONS } from "~/constants/calendar"

interface Props {
	variant?: "default" | "iconOnly"
}

const props = withDefaults(defineProps<Props>(), { variant: "default" })

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
	<template v-if="props.variant === 'iconOnly'">
		<UiDropdownMenu>
			<UiDropdownMenuTrigger as-child>
				<UiButton variant="ghost" size="icon" :aria-label="`Вид: ${viewLabel}`">
					<AppIcon name="lucide:layout-grid" />
				</UiButton>
			</UiDropdownMenuTrigger>
			<UiDropdownMenuContent align="end">
				<UiDropdownMenuRadioGroup :model-value="view" @update:model-value="updateView">
					<UiDropdownMenuRadioItem
						v-for="option in VIEW_OPTIONS"
						:key="option.value"
						:value="option.value"
						icon="lucide:check"
					>
						{{ option.label }}
					</UiDropdownMenuRadioItem>
				</UiDropdownMenuRadioGroup>
			</UiDropdownMenuContent>
		</UiDropdownMenu>
	</template>

	<template v-else>
		<UiSelect :model-value="view" @update:model-value="updateView">
			<UiSelectTrigger class="w-auto max-md:w-full" aria-label="Вид календаря">
				<UiSelectValue>{{ viewLabel }}</UiSelectValue>
			</UiSelectTrigger>
			<UiSelectContent>
				<UiSelectItem
					v-for="option in VIEW_OPTIONS"
					:key="option.value"
					:value="option.value"
				>
					{{ option.label }}
				</UiSelectItem>
			</UiSelectContent>
		</UiSelect>
	</template>
</template>
