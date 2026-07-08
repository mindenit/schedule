<script setup lang="ts">
interface Props {
	show: boolean
	icon?: string
	title?: string
	description?: string
}

withDefaults(defineProps<Props>(), {
	icon: "lucide:calendar-x",
	title: "Немає пар",
	description: "Немає запланованих занять",
})

const filtersStore = useFiltersStore()
const { trackEvent } = useAnalytics()

function resetFilters() {
	filtersStore.clearAll()
	trackEvent("empty_state_filters_reset")
	useSonner("Фільтри скинуто", { duration: 2000 })
}
</script>

<template>
	<Transition
		enter-active-class="transition-opacity duration-300 ease-out"
		enter-from-class="opacity-0"
		enter-to-class="opacity-100"
		leave-active-class="transition-opacity duration-200 ease-in"
		leave-from-class="opacity-100"
		leave-to-class="opacity-0"
	>
		<div
			v-if="show"
			class="bg-background/70 pointer-events-none absolute inset-0 flex items-center
				justify-center backdrop-blur-sm"
		>
			<div
				class="border-border bg-card pointer-events-auto mx-4 rounded-lg border p-6
					shadow-lg"
			>
				<div class="flex items-center gap-4">
					<AppIcon :name="icon" class="shrink-0" />
					<div>
						<h3 class="text-lg font-semibold">{{ title }}</h3>
						<p class="text-muted-foreground text-sm">{{ description }}</p>
					</div>
				</div>
				<div v-if="filtersStore.hasActive" class="mt-4 flex justify-end">
					<UiButton size="sm" variant="outline" @click="resetFilters">
						<AppIcon name="lucide:rotate-ccw" />
						Скинути фільтри
					</UiButton>
				</div>
			</div>
		</div>
	</Transition>
</template>
