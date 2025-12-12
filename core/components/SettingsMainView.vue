<script setup lang="ts">
import { storeToRefs } from "pinia"
import { toast } from "vue-sonner"
import { useSettingsStore } from "@/core/stores/settings"

const scheduleStore = useScheduleStore()
const settingsStore = useSettingsStore()
const { isSnowEnabled } = storeToRefs(settingsStore)

const { selectedSchedule, allSchedules } = storeToRefs(scheduleStore)
const { exportAcademicYearSchedule, isLoading } = useScheduleIcsExport()

const getIconByType = (type: string) => {
	return SCHEDULE_ICONS[type] || "lucide:calendar"
}

const copyAllSchedulesToClipboard = async () => {
	if (allSchedules.value.length === 0) {
		toast.warning("Немає даних для копіювання")
		return
	}

	const markdownContent = allSchedules.value
		.map((schedule) => {
			const isActive =
				selectedSchedule.value &&
				String(selectedSchedule.value.id) === String(schedule.id) &&
				selectedSchedule.value.type === schedule.type

			const prefix = isActive ? "🔥 " : "- "
			return `${prefix}**${schedule.type}** • ID: \`${schedule.id}\` • ${schedule.name}`
		})
		.join("\n")

	const fullMarkdown = `# Збережені розклади\n\n${markdownContent}`

	try {
		await navigator.clipboard.writeText(fullMarkdown)
		toast.success("Інформацію скопійовано", {
			description: "Дані про всі розклади скопійовано у буфер обміну",
		})
	} catch {
		toast.error("Помилка копіювання", {
			description: "Не вдалося скопіювати дані у буфер обміну",
		})
	}
}

const handleIcsExportAcademicYear = async () => {
	if (!selectedSchedule.value) {
		toast.warning("Оберіть розклад", {
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
	<div class="flex min-h-0 flex-col gap-4 overflow-y-auto py-4">
		<Tabs default-value="schedule" class="w-full">
			<TabsList class="grid w-full grid-cols-3">
				<TabsTrigger value="schedule">
					<AppIcon name="lucide:calendar" size="xs" />
					Розклад
				</TabsTrigger>
				<TabsTrigger value="links">
					<AppIcon name="lucide:link" size="xs" />
					Посилання
				</TabsTrigger>
				<TabsTrigger value="bug">
					<AppIcon name="lucide:bug" size="xs" />
					Debug
				</TabsTrigger>
			</TabsList>

			<TabsContent value="schedule">
				<h3 class="text-muted-foreground mb-2 text-sm font-medium">Експорт розкладу (ICS)</h3>
				<div class="flex flex-wrap items-center justify-center gap-2">
					<Button variant="default" :disabled="isLoading" @click="handleIcsExportAcademicYear">
						<AppIcon name="lucide:calendar-export" />
						Експорт на навчальний рік
					</Button>
				</div>

				<h3 class="text-muted-foreground mt-4 mb-2 text-sm font-medium">Ефекти</h3>
				<div class="flex items-center justify-between rounded-lg border p-4">
					<div class="flex flex-col gap-1">
						<div class="text-sm font-medium">Снігопад</div>
						<div class="text-muted-foreground text-xs">Зимовий ефект падаючого снігу</div>
					</div>
					<Button
						:variant="isSnowEnabled ? 'default' : 'outline'"
						size="sm"
						@click="isSnowEnabled = !isSnowEnabled"
					>
						{{ isSnowEnabled ? "Увімкнено" : "Вимкнено" }}
					</Button>
				</div>
			</TabsContent>

			<TabsContent value="links">
				<SettingsLinksManagement />
			</TabsContent>

			<TabsContent value="bug">
				<h3 class="text-muted-foreground mb-2 text-sm font-medium">Активні елементи розкладу</h3>
				<div class="space-y-3">
					<div v-if="allSchedules.length === 0" class="text-muted-foreground py-4 text-center">
						Немає збережених розкладів
					</div>
					<div v-else class="space-y-2">
						<div
							v-for="schedule in allSchedules"
							:key="`${schedule.type}-${schedule.id}`"
							:class="[
								'bg-card flex items-center gap-3 rounded-lg border-2 p-3',
								selectedSchedule &&
								String(selectedSchedule.id) === String(schedule.id) &&
								selectedSchedule.type === schedule.type
									? 'border-primary'
									: 'border-border',
							]"
						>
							<AppIcon :name="getIconByType(schedule.type)" class="text-muted-foreground" />
							<div class="min-w-0 flex-1">
								<div class="text-sm font-medium">{{ schedule.name }}</div>
								<div class="text-muted-foreground text-xs">
									{{ schedule.type }} • ID: {{ schedule.id }}
								</div>
							</div>
						</div>
						<Button variant="outline" class="mt-4 w-full" @click="copyAllSchedulesToClipboard">
							<AppIcon name="lucide:copy" />
							Скопіювати все
						</Button>
					</div>
				</div>
			</TabsContent>
		</Tabs>
	</div>
</template>
