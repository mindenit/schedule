<script setup lang="ts">
import { storeToRefs } from "pinia"
import { useSettingsStore } from "~/stores/settings"
import { CURATED_TIMEZONES, TIMEZONE_LOCAL, getUtcOffsetLabel } from "~/constants/timezones"

const scheduleStore = useScheduleStore()
const settingsStore = useSettingsStore()
const { trackEvent } = useAnalytics()
const { isSnowEnabled, isUrlSyncEnabled, timezone } = storeToRefs(settingsStore)
const { effectiveTimezone } = useTimezone()
const { selectedSchedule } = storeToRefs(scheduleStore)
const { exportAcademicYearSchedule, isLoading } = useScheduleIcsExport()

// Shared state — useState keys keep one ref across all call-sites.
const isShortcutsOpen = useState("shortcuts:open", () => false)
const isSettingsOpen = useState("settings:open", () => false)

async function openShortcuts() {
	// Close settings first; wait a tick so Reka tears down its overlay before
	// the shortcuts dialog mounts — prevents z-index stacking and Escape conflicts.
	isSettingsOpen.value = false
	await nextTick()
	isShortcutsOpen.value = true
}

const handleIcsExportAcademicYear = async () => {
	if (!selectedSchedule.value) {
		useSonner.warning("Оберіть розклад", {
			description: "Спочатку оберіть групу, викладача або аудиторію",
		})
		return
	}

	const schedule = selectedSchedule.value
	await exportAcademicYearSchedule(schedule.id, schedule.type, {
		customFilename: `academic-schedule-${schedule.name}-${new Date().getFullYear()}.ics`,
	})
	trackEvent("ics_exported", { schedule_type: schedule.type })
}
</script>

<template>
	<div class="overflow-y-auto">
		<h3 class="text-muted-foreground mb-2 text-sm font-medium">Експорт розкладу</h3>
		<div class="flex items-center justify-between rounded-lg border p-4">
			<div class="flex flex-col gap-1">
				<div class="text-sm font-medium">Навчальний рік</div>
				<div class="text-muted-foreground text-xs">
					Завантажте розклад у форматі .ics для Google Календар, Apple Calendar тощо
				</div>
			</div>
			<UiButton size="sm" :disabled="isLoading" @click="handleIcsExportAcademicYear">
				<AppIcon name="lucide:calendar-arrow-down" />
				Експорт
			</UiButton>
		</div>

		<h3 class="text-muted-foreground mt-6 mb-2 text-sm font-medium">Поведінка</h3>
		<div class="flex items-center justify-between rounded-lg border p-4">
			<div class="flex flex-col gap-1">
				<div class="text-sm font-medium">Синхронізація з URL</div>
				<div class="text-muted-foreground text-xs">
					Зберігати вигляд, дату та розклад у адресному рядку для обміну посиланнями
				</div>
			</div>
			<UiSwitch
				v-model="isUrlSyncEnabled"
				@update:model-value="trackEvent('settings_changed', { setting: 'url_sync', value: $event })"
			/>
		</div>

		<div class="mt-3 flex flex-col gap-2 rounded-lg border p-4">
			<div class="flex flex-col gap-1">
				<div class="text-sm font-medium">Часовий пояс</div>
				<div class="text-muted-foreground text-xs">
					Відображення часу подій та експорт .ics у вибраному часовому поясі
				</div>
			</div>
			<UiSelect
				v-model="timezone"
				@update:model-value="trackEvent('settings_changed', { setting: 'timezone', value: $event })"
			>
				<UiSelectTrigger>
					<UiSelectValue placeholder="Оберіть часовий пояс..." />
				</UiSelectTrigger>
				<UiSelectContent>
					<UiSelectItem :value="TIMEZONE_LOCAL">Локальний (браузер)</UiSelectItem>
					<UiSelectSeparator />
					<template v-for="group in CURATED_TIMEZONES" :key="group.group">
						<UiSelectGroup>
							<UiSelectLabel>{{ group.group }}</UiSelectLabel>
							<UiSelectItem v-for="zone in group.zones" :key="zone.iana" :value="zone.iana">
								<span class="flex w-full items-center justify-between gap-4">
									<span>{{ zone.label }}</span>
									<span class="text-muted-foreground text-xs tabular-nums">
										{{ getUtcOffsetLabel(zone.iana) }}
									</span>
								</span>
							</UiSelectItem>
						</UiSelectGroup>
						<UiSelectSeparator />
					</template>
				</UiSelectContent>
			</UiSelect>
			<p v-if="timezone !== TIMEZONE_LOCAL" class="text-muted-foreground text-xs">
				Активний: {{ effectiveTimezone }}
			</p>
		</div>

		<h3 class="text-muted-foreground mt-6 mb-2 text-sm font-medium">Зовнішній вигляд</h3>
		<div class="flex items-center justify-between rounded-lg border p-4">
			<div class="flex flex-col gap-1">
				<div class="text-sm font-medium">Снігопад</div>
				<div class="text-muted-foreground text-xs">Зимовий ефект падаючого снігу</div>
			</div>
			<UiSwitch
				v-model="isSnowEnabled"
				@update:model-value="trackEvent('settings_changed', { setting: 'snow', value: $event })"
			/>
		</div>

		<h3 class="text-muted-foreground mt-6 mb-2 text-sm font-medium">Довідка</h3>
		<div class="flex items-center justify-between rounded-lg border p-4">
			<div class="flex flex-col gap-1">
				<div class="text-sm font-medium">Гарячі клавіші</div>
				<div class="text-muted-foreground text-xs">Швидка навігація по календарю без миші</div>
			</div>
			<UiButton size="sm" variant="outline" @click="openShortcuts">
				<AppIcon name="lucide:keyboard" />
				Переглянути
			</UiButton>
		</div>
	</div>
</template>
