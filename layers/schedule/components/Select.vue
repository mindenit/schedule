<script setup lang="ts">
import { SCHEDULE_ICONS, SCHEDULE_TYPES } from "../constants"

const scheduleStore = useScheduleStore()

const selectedValue = computed({
	get: () => {
		return scheduleStore.selectedSchedule?.id?.toString() || ""
	},
	set: (value: string) => {
		if (value) {
			const schedule = scheduleStore.allSchedules.find((s) => s.id.toString() === value)
			if (schedule) {
				scheduleStore.selectSchedule(schedule)
			}
		}
	},
})

const getIconByType = (type: string) => {
	return SCHEDULE_ICONS[type] || "lucide:calendar"
}

const getTypeLabel = (type: string) => {
	return SCHEDULE_TYPES[type] || "Розклад"
}
</script>

<template>
	<Select v-model="selectedValue" :disabled="!scheduleStore.isInitialized">
		<SelectTrigger class="w-full">
			<SelectValue>
				<template v-if="!scheduleStore.isInitialized">
					<div class="flex items-center gap-2">
						<AppIcon name="lucide:loader-2" class="animate-spin" />
						<span class="text-muted-foreground">Завантаження...</span>
					</div>
				</template>
				<template v-else-if="scheduleStore.selectedSchedule">
					<div class="flex items-center gap-2">
						<AppIcon :name="getIconByType(scheduleStore.selectedSchedule.type)" />
						<span>{{ scheduleStore.selectedSchedule.name }}</span>
					</div>
				</template>
				<template v-else>
					<span class="text-muted-foreground">Оберіть розклад</span>
				</template>
			</SelectValue>
		</SelectTrigger>
		<SelectContent>
			<template v-if="!scheduleStore.isInitialized">
				<div class="flex items-center justify-center gap-2 p-4">
					<AppIcon name="lucide:loader-2" class="animate-spin" />
					<span class="text-muted-foreground text-sm">Завантаження...</span>
				</div>
			</template>
			<template v-else-if="scheduleStore.allSchedules.length > 0">
				<SelectItem
					v-for="schedule in scheduleStore.allSchedules"
					:key="`${schedule.type}-${schedule.id}`"
					:value="schedule.id.toString()"
				>
					<div class="flex items-center gap-2">
						<AppIcon :name="getIconByType(schedule.type)" class="flex shrink-0" />
						<div class="flex flex-col">
							<span>{{ schedule.name }}</span>
							<span class="text-muted-foreground text-xs">
								{{ getTypeLabel(schedule.type) }}
							</span>
						</div>
					</div>
				</SelectItem>
			</template>
			<template v-else>
				<div class="text-muted-foreground p-2 text-center text-sm">Немає доданих розкладів</div>
			</template>
		</SelectContent>
	</Select>
</template>
