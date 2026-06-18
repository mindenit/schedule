<script setup lang="ts">
import { storeToRefs } from "pinia"
import { toast } from "vue-sonner"
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from "date-fns"
import { uk } from "date-fns/locale"
import { useSettingsStore } from "~/stores/settings"
import { getScheduleIcon } from "~/constants/schedule"

const scheduleStore = useScheduleStore()
const calendarStore = useCalendarStore()
const settingsStore = useSettingsStore()
const { isSnowEnabled } = storeToRefs(settingsStore)

const { selectedSchedule, allSchedules } = storeToRefs(scheduleStore)
const { selectedDate, view } = storeToRefs(calendarStore)
const { exportAcademicYearSchedule, isLoading } = useScheduleIcsExport()

const TYPE_LABELS: Record<string, string> = {
	group: "Група",
	teacher: "Викладач",
	auditorium: "Аудиторія",
}

const VIEW_LABELS: Record<string, string> = {
	day: "День",
	week: "Тиждень",
	month: "Місяць",
}

const typeLabel = (type: string) => TYPE_LABELS[type] ?? type
const viewLabel = computed(() => VIEW_LABELS[view.value] ?? view.value)

const viewRange = computed(() => {
	const date = selectedDate.value
	if (view.value === "day") {
		const start = new Date(date)
		start.setHours(0, 0, 0, 0)
		const end = new Date(date)
		end.setHours(23, 59, 59, 999)
		return { start, end }
	}
	if (view.value === "week") {
		return {
			start: startOfWeek(date, WEEK_OPTIONS),
			end: endOfWeek(date, WEEK_OPTIONS),
		}
	}
	// month
	return {
		start: startOfWeek(startOfMonth(date), WEEK_OPTIONS),
		end: endOfWeek(endOfMonth(date), WEEK_OPTIONS),
	}
})

const fmt = (date: Date) => format(date, "dd.MM.yyyy HH:mm:ss", { locale: uk })
const fmtDate = (date: Date) => format(date, "dd.MM.yyyy", { locale: uk })
const toUnix = (date: Date) => Math.floor(date.getTime() / 1000)


const copyAllSchedulesToClipboard = async () => {
	if (allSchedules.value.length === 0) {
		toast.warning("Немає даних для копіювання")
		return
	}

	const now = new Date()
	const active = selectedSchedule.value
	const range = viewRange.value

	const schedulesText = allSchedules.value
		.map((schedule) => {
			const isActive =
				active &&
				String(active.id) === String(schedule.id) &&
				active.type === schedule.type
			const marker = isActive ? " [active]" : ""
			const bullet = isActive ? "[*]" : "[ ]"
			return `${bullet} ${typeLabel(schedule.type)} • ID: ${schedule.id} • ${schedule.name}${marker}`
		})
		.join("\n")

	const lines = [
		"# Налагодження розкладу",
		"",
		`Дата формування: ${fmt(now)}`,
		`Активний вигляд: ${viewLabel.value}`,
		`Обрана дата: ${fmtDate(selectedDate.value)}`,
		active
			? `Обраний розклад: ${active.name} (${typeLabel(active.type)}, ID: ${active.id})`
			: "Обраний розклад: —",
		"",
		"## Збережені розклади",
		"",
		schedulesText,
		"",
		`## Часові мітки поточного вигляду (${viewLabel.value})`,
		"",
		`Початок: ${fmt(range.start)} (Unix: ${toUnix(range.start)})`,
		`Кінець:  ${fmt(range.end)} (Unix: ${toUnix(range.end)})`,
	]

	try {
		await navigator.clipboard.writeText(lines.join("\n"))
		toast.success("Інформацію скопійовано", {
			description: "Дані про розклад та часові мітки скопійовано у буфер обміну",
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
		<UiTabs default-value="schedule" class="w-full">
			<UiTabsList class="grid w-full grid-cols-3">
				<UiTabsTrigger value="schedule">
					<AppIcon name="lucide:calendar" size="xs" />
					Розклад
				</UiTabsTrigger>
				<UiTabsTrigger value="links">
					<AppIcon name="lucide:link" size="xs" />
					Посилання
				</UiTabsTrigger>
				<UiTabsTrigger value="bug">
					<AppIcon name="lucide:bug" size="xs" />
					Debug
				</UiTabsTrigger>
			</UiTabsList>

			<UiTabsContent value="schedule">
				<h3 class="text-muted-foreground mb-2 text-sm font-medium">Експорт розкладу (ICS)</h3>
				<div class="flex flex-wrap items-center justify-center gap-2">
					<UiButton variant="default" :disabled="isLoading" @click="handleIcsExportAcademicYear">
						<AppIcon name="lucide:calendar-export" />
						Експорт на навчальний рік
					</UiButton>
				</div>

				<h3 class="text-muted-foreground mt-4 mb-2 text-sm font-medium">Ефекти</h3>
				<div class="flex items-center justify-between rounded-lg border p-4">
					<div class="flex flex-col gap-1">
						<div class="text-sm font-medium">Снігопад</div>
						<div class="text-muted-foreground text-xs">Зимовий ефект падаючого снігу</div>
					</div>
					<UiButton
						:variant="isSnowEnabled ? 'default' : 'outline'"
						size="sm"
						@click="isSnowEnabled = !isSnowEnabled"
					>
						{{ isSnowEnabled ? "Увімкнено" : "Вимкнено" }}
					</UiButton>
				</div>
			</UiTabsContent>

			<UiTabsContent value="links">
				<SettingsLinksManagement />
			</UiTabsContent>

		<UiTabsContent value="bug">
			<div class="space-y-4">
				<!-- View info -->
				<div class="bg-muted flex items-center justify-between rounded-lg px-3 py-2 text-xs">
					<span class="text-muted-foreground">Вигляд</span>
					<span class="font-medium">{{ viewLabel }}</span>
				</div>

				<!-- Schedules list -->
				<div>
					<h3 class="text-muted-foreground mb-2 text-sm font-medium">Збережені розклади</h3>
					<div v-if="allSchedules.length === 0" class="text-muted-foreground py-4 text-center text-sm">
						Немає збережених розкладів
					</div>
					<div v-else class="space-y-2">
						<div
							v-for="schedule in allSchedules"
							:key="`${schedule.type}-${schedule.id}`"
							:class="[
								'bg-card flex items-center gap-3 rounded-lg border p-3',
								selectedSchedule &&
								String(selectedSchedule.id) === String(schedule.id) &&
								selectedSchedule.type === schedule.type
									? 'border-l-primary border-l-4'
									: 'border-border',
							]"
						>
							<AppIcon :name="getScheduleIcon(schedule.type)" class="text-muted-foreground shrink-0" />
							<div class="min-w-0 flex-1">
								<div class="text-sm font-medium">{{ schedule.name }}</div>
								<div class="text-muted-foreground font-mono text-xs">
									{{ schedule.type }} • {{ schedule.id }}
								</div>
							</div>
							<span
								v-if="
									selectedSchedule &&
									String(selectedSchedule.id) === String(schedule.id) &&
									selectedSchedule.type === schedule.type
								"
								class="bg-primary/10 text-primary rounded px-1.5 py-0.5 font-mono text-[10px] font-medium tracking-wide"
							>
								active
							</span>
						</div>
					</div>
				</div>

				<!-- Timestamp range -->
				<div>
					<h3 class="text-muted-foreground mb-2 text-sm font-medium">
						Часові мітки — {{ viewLabel }}
					</h3>
					<div class="bg-muted rounded-lg px-3 py-2 text-xs space-y-1">
						<div class="flex items-center justify-between gap-2">
							<span class="text-muted-foreground shrink-0">Початок</span>
							<span class="font-mono font-medium tabular-nums">
								{{ fmt(viewRange.start) }}
							</span>
							<span class="text-muted-foreground font-mono tabular-nums">
								{{ toUnix(viewRange.start) }}
							</span>
						</div>
						<div class="flex items-center justify-between gap-2">
							<span class="text-muted-foreground shrink-0">Кінець</span>
							<span class="font-mono font-medium tabular-nums">
								{{ fmt(viewRange.end) }}
							</span>
							<span class="text-muted-foreground font-mono tabular-nums">
								{{ toUnix(viewRange.end) }}
							</span>
						</div>
					</div>
				</div>

				<!-- Copy button -->
				<UiButton
					variant="outline"
					class="w-full"
					:disabled="allSchedules.length === 0"
					@click="copyAllSchedulesToClipboard"
				>
					<AppIcon name="lucide:copy" />
					Скопіювати для звіту
				</UiButton>
			</div>
		</UiTabsContent>
		</UiTabs>
	</div>
</template>
