<script setup lang="ts">
import { getScheduleIcon, getScheduleTypeLabel } from "~/constants/schedule"

const scheduleStore = useScheduleStore()
const { trackEvent } = useAnalytics()

const selectedValue = computed({
	get: () => {
		return scheduleStore.selectedSchedule?.id?.toString() || ""
	},
	set: (value: string) => {
		if (value) {
			const schedule = scheduleStore.allSchedules.find((s) => s.id.toString() === value)
			if (schedule) {
				scheduleStore.selectSchedule(schedule)
				trackEvent("schedule_switched", {
					type: schedule.type,
					total_schedules: scheduleStore.allSchedules.length,
				})
			}
		}
	},
})
</script>

<template>
	<UiSelect v-model="selectedValue" :disabled="!scheduleStore.isInitialized">
		<UiSelectTrigger class="w-full">
			<UiSelectValue>
				<template v-if="!scheduleStore.isInitialized">
					<div class="flex items-center gap-2">
						<AppIcon name="lucide:loader-2" class="animate-spin" />
						<span class="text-muted-foreground">Завантаження...</span>
					</div>
				</template>
				<template v-else-if="scheduleStore.selectedSchedule">
					<div class="flex items-center gap-2">
						<AppIcon :name="getScheduleIcon(scheduleStore.selectedSchedule.type)" />
						<span>{{ scheduleStore.selectedSchedule.name }}</span>
					</div>
				</template>
				<template v-else>
					<span class="text-muted-foreground">Оберіть розклад</span>
				</template>
			</UiSelectValue>
		</UiSelectTrigger>
		<UiSelectContent>
			<template v-if="!scheduleStore.isInitialized">
				<div class="flex items-center justify-center gap-2 p-4">
					<AppIcon name="lucide:loader-2" class="animate-spin" />
					<span class="text-muted-foreground text-sm">Завантаження...</span>
				</div>
			</template>
			<template v-else-if="scheduleStore.allSchedules.length > 0">
				<UiSelectItem
					v-for="schedule in scheduleStore.allSchedules"
					:key="`${schedule.type}-${schedule.id}`"
					:value="schedule.id.toString()"
				>
					<div class="flex items-center gap-2">
						<AppIcon :name="getScheduleIcon(schedule.type)" class="flex shrink-0" />
						<div class="flex flex-col">
							<span>{{ schedule.name }}</span>
							<span class="text-muted-foreground text-xs">
								{{ getScheduleTypeLabel(schedule.type) }}
							</span>
						</div>
					</div>
				</UiSelectItem>
			</template>
			<template v-else>
				<AppEmptyState title="Немає доданих розкладів" />
			</template>
		</UiSelectContent>
	</UiSelect>
</template>
