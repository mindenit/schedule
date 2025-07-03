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
	<Select v-model="selectedValue">
		<SelectTrigger class="w-full">
			<SelectValue placeholder="Оберіть розклад">
				<template v-if="scheduleStore.selectedSchedule">
					<div class="flex items-center gap-2">
						<Icon :name="getIconByType(scheduleStore.selectedSchedule.type)" class="h-4 w-4" />
						<span>{{ scheduleStore.selectedSchedule.name }}</span>
					</div>
				</template>
			</SelectValue>
		</SelectTrigger>
		<SelectContent>
			<template v-if="scheduleStore.allSchedules.length > 0">
				<SelectItem
					v-for="schedule in scheduleStore.allSchedules"
					:key="`${schedule.type}-${schedule.id}`"
					:value="schedule.id.toString()"
				>
					<div class="flex items-center gap-2">
						<Icon :name="getIconByType(schedule.type)" class="flex-shrink-0" />
						<div class="flex flex-col">
							<span>{{ schedule.name }}</span>
							<span class="text-muted-foreground text-xs">
								{{ getTypeLabel(schedule.type) }}
							</span>
						</div>
					</div>
				</SelectItem>
			</template>
			<template v-else-if="scheduleStore.isInitialized">
				<div class="text-muted-foreground p-2 text-center text-sm">Немає доданих розкладів</div>
			</template>
			<template v-else>
				<TheLoader />
			</template>
		</SelectContent>
	</Select>
</template>
