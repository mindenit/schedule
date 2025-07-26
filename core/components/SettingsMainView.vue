<script setup lang="ts">
import { storeToRefs } from "pinia"
import { toast } from "vue-sonner"

const calendarStore = useCalendarStore()
const scheduleStore = useScheduleStore()

const { allEvents } = storeToRefs(calendarStore)
const { selectedSchedule } = storeToRefs(scheduleStore)
const { exportCurrentSchedule, exportAcademicYearSchedule, isLoading } = useScheduleIcsExport()

const handleIcsExportCurrent = () => {
	exportCurrentSchedule(allEvents.value)
}

const handleIcsExportAcademicYear = async () => {
	if (!selectedSchedule.value) {
		toast.warning("Оберіть розкладання", {
			description: "Спочатку оберіть групу, викладача або аудиторію",
		})
		return
	}

	const schedule = selectedSchedule.value
	await exportAcademicYearSchedule(schedule.id, schedule.type, {
		customFilename: `academic-schedule-${schedule.name}-${new Date().getFullYear()}.ics`,
	})
}
</script>

<template>
	<div class="flex flex-col gap-4 overflow-y-auto py-4">
		<Tabs default-value="schedule" class="w-full">
			<TabsList class="grid w-full grid-cols-2">
				<TabsTrigger value="schedule">
					<Icon name="lucide:calendar" />
					Розклад
				</TabsTrigger>
				<TabsTrigger value="links">
					<Icon name="lucide:link" />
					Посилання
				</TabsTrigger>
			</TabsList>

			<TabsContent value="schedule">
				<h3 class="text-muted-foreground mb-2 text-sm font-medium">Експорт розкладання (ICS)</h3>
				<div class="flex flex-wrap items-center justify-center gap-2">
					<Button variant="default" :disabled="isLoading" @click="handleIcsExportAcademicYear">
						<Icon name="lucide:calendar-export" />
						Експорт на навчальний рік
					</Button>
					<Button variant="outline" @click="handleIcsExportCurrent">
						<Icon name="lucide:calendar" />
						Експорт поточних подій
					</Button>
				</div>
			</TabsContent>

			<TabsContent value="links">
				<SettingsLinksManagement />
			</TabsContent>
		</Tabs>
	</div>
</template>
