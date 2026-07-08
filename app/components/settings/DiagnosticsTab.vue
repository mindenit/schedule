<script setup lang="ts">
import { storeToRefs } from "pinia"
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from "date-fns"
import { uk } from "date-fns/locale"
import { getScheduleIcon } from "~/constants/schedule"

const scheduleStore = useScheduleStore()
const calendarStore = useCalendarStore()
const { trackEvent } = useAnalytics()
const runtimeConfig = useRuntimeConfig()

const { selectedSchedule, allSchedules } = storeToRefs(scheduleStore)
const { selectedDate, view } = storeToRefs(calendarStore)

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
	// month (and year fallback)
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
		useSonner.warning("Немає даних для копіювання", {
			description: "Додайте розклади перед копіюванням",
		})
		return
	}

	const now = new Date()
	const active = selectedSchedule.value
	const range = viewRange.value

	const schedulesText = allSchedules.value
		.map((schedule) => {
			const isActive =
				active && String(active.id) === String(schedule.id) && active.type === schedule.type
			const marker = isActive ? " [active]" : ""
			const bullet = isActive ? "[*]" : "[ ]"
			return `${bullet} ${typeLabel(schedule.type)} • ID: ${schedule.id} • ${schedule.name}${marker}`
		})
		.join("\n")

	const lines = [
		"# Налагодження розкладу",
		"",
		`Версія: v${runtimeConfig.public.appVersion} · ${runtimeConfig.public.commitSha}`,
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
		const text = lines.join("\n")
		if (navigator.clipboard) {
			await navigator.clipboard.writeText(text)
		} else {
			// Fallback for non-secure contexts (HTTP over LAN, etc.)
			const textarea = document.createElement("textarea")
			textarea.value = text
			textarea.style.position = "fixed"
			textarea.style.opacity = "0"
			document.body.appendChild(textarea)
			textarea.focus()
			textarea.select()
			const ok = document.execCommand("copy")
			document.body.removeChild(textarea)
			if (!ok) throw new Error("execCommand copy failed")
		}
		trackEvent("diagnostics_copied")
		useSonner.success("Інформацію скопійовано", {
			description: "Дані про розклад та часові мітки скопійовано у буфер обміну",
		})
	} catch {
		useSonner.error("Помилка копіювання", {
			description: "Не вдалося скопіювати дані у буфер обміну",
		})
	}
}
</script>

<template>
	<div class="overflow-y-auto pb-4">
		<div class="space-y-4">
			<!-- Version -->
			<div class="bg-muted flex items-center justify-between rounded-lg px-3 py-2 text-xs">
				<span class="text-muted-foreground">Версія</span>
				<span class="font-mono font-medium">
					v{{ $config.public.appVersion }} · {{ $config.public.commitSha }}
				</span>
			</div>

			<!-- View info -->
			<div class="bg-muted flex items-center justify-between rounded-lg px-3 py-2 text-xs">
				<span class="text-muted-foreground">Вигляд</span>
				<span class="font-medium">{{ viewLabel }}</span>
			</div>

			<!-- Schedules list -->
			<div>
				<h3 class="text-muted-foreground mb-2 text-sm font-medium">Збережені розклади</h3>
				<div
					v-if="allSchedules.length === 0"
					class="text-muted-foreground py-4 text-center text-sm"
				>
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
						<AppIcon
							:name="getScheduleIcon(schedule.type)"
							class="text-muted-foreground shrink-0"
						/>
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
							class="bg-primary/10 text-primary rounded px-1.5 py-0.5 font-mono
								text-[10px] font-medium tracking-wide"
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
				<div class="bg-muted space-y-1 rounded-lg px-3 py-2 text-xs">
					<div class="flex items-center justify-between gap-2">
						<span class="text-muted-foreground shrink-0">Початок</span>
						<span class="font-mono font-medium tabular-nums">{{
							fmt(viewRange.start)
						}}</span>
						<span class="text-muted-foreground font-mono tabular-nums">
							{{ toUnix(viewRange.start) }}
						</span>
					</div>
					<div class="flex items-center justify-between gap-2">
						<span class="text-muted-foreground shrink-0">Кінець</span>
						<span class="font-mono font-medium tabular-nums">{{
							fmt(viewRange.end)
						}}</span>
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
	</div>
</template>
