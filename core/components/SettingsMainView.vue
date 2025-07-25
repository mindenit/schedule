<script setup lang="ts">
import { storeToRefs } from "pinia"
import { toast } from "vue-sonner"
import { useLinksStore } from "~/core/stores/links"

const emit = defineEmits<{
	navigate: [view: "links" | "export-tree"]
}>()

const calendarStore = useCalendarStore()
const scheduleStore = useScheduleStore()
const linksStore = useLinksStore()

const { allEvents } = storeToRefs(calendarStore)
const { selectedSchedule } = storeToRefs(scheduleStore)
const { exportCurrentSchedule, exportAcademicYearSchedule, isLoading } = useScheduleIcsExport()

const fileInput = ref<HTMLInputElement | null>(null)

const handleExport = () => {
	linksStore.exportLinks()
	toast.success("Експорт завершено", {
		description: "Всі посилання успішно експортовано",
	})
}

const triggerImport = () => {
	fileInput.value?.click()
}

const handleImport = (event: Event) => {
	const target = event.target as HTMLInputElement
	const file = target.files?.[0]
	if (!file) return

	const reader = new FileReader()
	reader.onload = (e) => {
		const result = linksStore.importLinks(e.target?.result as string)
		if (!result.success) {
			toast.error("Помилка імпорту", {
				description: result.error || "Не вдалося імпортувати посилання",
			})
		} else {
			toast.success("Імпорт завершено", {
				description: "Посилання успішно імпортовані",
			})
		}
	}
	reader.readAsText(file)
}

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

			<TabsContent value="schedule" class="space-y-4">
				<div class="space-y-2">
					<h3 class="text-muted-foreground text-sm font-medium">Експорт розкладання (ICS)</h3>
					<div class="flex flex-col gap-2">
						<Button variant="default" :disabled="isLoading" @click="handleIcsExportAcademicYear">
							<Icon name="lucide:calendar-export" />
							Експорт на навчальний рік
						</Button>
						<Button variant="outline" @click="handleIcsExportCurrent">
							<Icon name="lucide:calendar" />
							Експорт поточних подій
						</Button>
					</div>
				</div>
			</TabsContent>

			<TabsContent value="links" class="space-y-4">
				<div class="space-y-2">
					<h3 class="text-muted-foreground text-sm font-medium">Керування посиланнями</h3>
					<div class="flex flex-col gap-2">
						<Button variant="outline" @click="emit('navigate', 'links')">
							<Icon name="lucide:link" />
							Переглянути та редагувати посилання
						</Button>
						<Button variant="outline" @click="handleExport">
							<Icon name="lucide:upload" />
							Експортувати всі посилання
						</Button>
						<Button variant="outline" @click="emit('navigate', 'export-tree')">
							<Icon name="lucide:tree-pine" />
							Вибірковий експорт посилань
						</Button>
						<Button variant="outline" @click="triggerImport">
							<Icon name="lucide:download" />
							Імпортувати посилання
						</Button>
					</div>
				</div>
			</TabsContent>
		</Tabs>

		<input ref="fileInput" type="file" accept=".json" class="hidden" @change="handleImport" />
	</div>
</template>
