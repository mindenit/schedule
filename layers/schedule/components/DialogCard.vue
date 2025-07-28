<script lang="ts" setup>
import { SCHEDULE_ICONS } from "../constants"

interface Props {
	id: number
	name: string
	icon: ScheduleTabType
}

const props = defineProps<Props>()

const icon = computed(() => {
	return SCHEDULE_ICONS[props.icon]
})
</script>

<template>
	<div
		class="bg-card border-border group relative mb-2 cursor-pointer rounded-xl border p-4 transition-colors
			last:mb-0"
	>
		<div class="flex items-center gap-2">
			<div class="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-lg">
				<AppIcon :name="icon!" />
			</div>

			<h3 class="text-foreground text-lg font-semibold">{{ name }}</h3>
		</div>
	</div>
</template>
