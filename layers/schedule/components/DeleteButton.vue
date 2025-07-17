<script setup lang="ts">
import { storeToRefs } from "pinia"

const scheduleStore = useScheduleStore()
const { selectedSchedule, isInitialized } = storeToRefs(scheduleStore)
const showDialog = ref(false)

const isReady = ref(false)

const hasActiveSchedule = computed(() => {
	return isReady.value && !!selectedSchedule.value
})

onMounted(() => {
	nextTick(() => {
		const checkInitialization = () => {
			if (isInitialized.value) {
				isReady.value = true
			} else {
				setTimeout(checkInitialization, 100)
			}
		}
		checkInitialization()
	})
})

watch(isInitialized, (newVal) => {
	if (newVal) {
		isReady.value = true
	}
})

const removeActiveSchedule = () => {
	if (selectedSchedule.value) {
		scheduleStore.removeSchedule(selectedSchedule.value.id)
	}
	showDialog.value = false
}

const getScheduleIcon = (type: string) => {
	return SCHEDULE_ICONS[type] || "lucide:calendar"
}

const getScheduleTypeName = (type: string) => {
	return SCHEDULE_TYPES[type] || "Розклад"
}
</script>

<template>
	<AlertDialog v-model:open="showDialog">
		<AlertDialogTrigger as-child>
			<Button size="icon" variant="destructive" :disabled="!hasActiveSchedule">
				<Icon name="lucide:trash" class="!size-4" />
			</Button>
		</AlertDialogTrigger>
		<AlertDialogContent>
			<AlertDialogHeader>
				<AlertDialogTitle class="flex items-center gap-2">
					<Icon name="lucide:alert-triangle" class="text-destructive size-5" />
					Видалити розклад
				</AlertDialogTitle>
				<AlertDialogDescription>
					Ви впевнені, що хочете видалити цей розклад зі збережених?
				</AlertDialogDescription>
			</AlertDialogHeader>
			<div v-if="selectedSchedule" class="bg-muted rounded-lg p-4">
				<div class="flex items-center gap-3">
					<Icon
						:name="getScheduleIcon(selectedSchedule.type)"
						class="text-muted-foreground h-6 w-6 flex-shrink-0"
					/>
					<div>
						<p class="font-medium">{{ selectedSchedule.name }}</p>
						<p class="text-muted-foreground text-sm">
							{{ getScheduleTypeName(selectedSchedule.type) }}
						</p>
					</div>
				</div>
			</div>
			<AlertDialogFooter>
				<AlertDialogCancel>Скасувати</AlertDialogCancel>
				<AlertDialogAction class="bg-destructive" @click="removeActiveSchedule">
					<Icon name="lucide:trash" />
					Видалити
				</AlertDialogAction>
			</AlertDialogFooter>
		</AlertDialogContent>
	</AlertDialog>
</template>
