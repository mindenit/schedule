<script setup lang="ts">
import { storeToRefs } from "pinia"
import { getScheduleIcon, getScheduleTypeLabel } from "~/constants/schedule"

const scheduleStore = useScheduleStore()
const { selectedSchedule, isInitialized } = storeToRefs(scheduleStore)
const showDialog = ref(false)

// Wait for the store to hydrate from localStorage before enabling the button.
const hasActiveSchedule = computed(() => isInitialized.value && !!selectedSchedule.value)

const removeActiveSchedule = () => {
	if (selectedSchedule.value) {
		scheduleStore.removeSchedule(selectedSchedule.value.id)
	}
	showDialog.value = false
}
</script>

<template>
	<UiAlertDialog v-model:open="showDialog">
		<UiAlertDialogTrigger as-child>
			<UiButton size="icon" variant="destructive" :disabled="!hasActiveSchedule">
				<AppIcon name="lucide:trash" />
			</UiButton>
		</UiAlertDialogTrigger>
		<UiAlertDialogContent>
			<UiAlertDialogHeader>
				<UiAlertDialogTitle class="flex items-center gap-2">
					<AppIcon name="lucide:alert-triangle" class="text-destructive" />
					Видалити розклад
				</UiAlertDialogTitle>
				<UiAlertDialogDescription>
					Ви впевнені, що хочете видалити цей розклад зі збережених?
				</UiAlertDialogDescription>
			</UiAlertDialogHeader>
			<div v-if="selectedSchedule" class="bg-muted rounded-lg p-4">
				<div class="flex items-center gap-3">
					<AppIcon
						:name="getScheduleIcon(selectedSchedule.type)"
						class="text-muted-foreground flex-shrink-0"
					/>

					<div>
						<p class="font-medium">{{ selectedSchedule.name }}</p>
						<p class="text-muted-foreground text-sm">
							{{ getScheduleTypeLabel(selectedSchedule.type) }}
						</p>
					</div>
				</div>
			</div>
			<UiAlertDialogFooter>
				<UiAlertDialogCancel>Скасувати</UiAlertDialogCancel>
				<UiAlertDialogAction class="bg-destructive" @click="removeActiveSchedule">
					<AppIcon name="lucide:trash" />
					Видалити
				</UiAlertDialogAction>
			</UiAlertDialogFooter>
		</UiAlertDialogContent>
	</UiAlertDialog>
</template>
