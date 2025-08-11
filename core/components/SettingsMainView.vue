<script setup lang="ts">
import { storeToRefs } from "pinia"
import { toast } from "vue-sonner"

const { t } = useI18n()
const scheduleStore = useScheduleStore()

const { selectedSchedule, allSchedules } = storeToRefs(scheduleStore)
const { exportAcademicYearSchedule, isLoading } = useScheduleIcsExport()

const getIconByType = (type: string) => {
	return SCHEDULE_ICONS[type] || "lucide:calendar"
}

const copyAllSchedulesToClipboard = async () => {
	if (allSchedules.value.length === 0) {
		toast.warning(t("settings.no_data_to_copy"))
		return
	}

	const markdownContent = allSchedules.value
		.map((schedule) => {
			const isActive =
				selectedSchedule.value &&
				String(selectedSchedule.value.id) === String(schedule.id) &&
				selectedSchedule.value.type === schedule.type

			const prefix = isActive ? "🔥 " : "- "
			return `${prefix}**${schedule.type}** • ID: ${schedule.id} • ${schedule.name}`
		})
		.join("\n")

	const fullMarkdown = `# ${t("settings.active_schedules")}\n\n${markdownContent}`

	try {
		await navigator.clipboard.writeText(fullMarkdown)
		toast.success(t("settings.info_copied"), {
			description: t("settings.info_copied_description"),
		})
	} catch {
		toast.error(t("settings.copy_error"), {
			description: t("settings.copy_error_description"),
		})
	}
}

const handleIcsExportAcademicYear = async () => {
	if (!selectedSchedule.value) {
		toast.warning(t("settings.select_schedule"), {
			description: t("settings.select_schedule_description"),
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
			<TabsList class="grid w-full grid-cols-3">
				<TabsTrigger value="schedule">
					<AppIcon name="lucide:calendar" size="xs" />
					{{ t("settings.schedule") }}
				</TabsTrigger>
				<TabsTrigger value="links">
					<AppIcon name="lucide:link" size="xs" />
					{{ t("settings.links") }}
				</TabsTrigger>
				<TabsTrigger value="bug">
					<AppIcon name="lucide:bug" size="xs" />
					{{ t("settings.debug") }}
				</TabsTrigger>
			</TabsList>

			<TabsContent value="schedule">
				<h3 class="text-muted-foreground mb-2 text-sm font-medium">
					{{ t("settings.export_schedule") }}
				</h3>
				<div class="flex flex-wrap items-center justify-center gap-2">
					<Button variant="default" :disabled="isLoading" @click="handleIcsExportAcademicYear">
						<AppIcon name="lucide:calendar-export" />
						{{ t("settings.export_academic_year") }}
					</Button>
				</div>
			</TabsContent>

			<TabsContent value="links">
				<SettingsLinksManagement />
			</TabsContent>

			<TabsContent value="bug">
				<h3 class="text-muted-foreground mb-2 text-sm font-medium">
					{{ t("settings.active_schedules") }}
				</h3>
				<div class="space-y-3">
					<div v-if="allSchedules.length === 0" class="text-muted-foreground py-4 text-center">
						{{ t("settings.no_saved_schedules") }}
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
							{{ t("settings.copy_all") }}
						</Button>
					</div>
				</div>
			</TabsContent>
		</Tabs>
	</div>
</template>
