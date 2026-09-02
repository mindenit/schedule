import type { SyncRun, SyncRunGroup, DashSummary } from "~/queries/dash"

// ── Labels ────────────────────────────────────────────────────────────────────

export const STATUS_LABELS: Record<string, string> = {
	running: "Виконується",
	success: "Успіх",
	partial: "Частковий",
	failed: "Помилка",
	unknown: "Невідомо",
}

export const TRIGGER_LABELS: Record<string, string> = {
	cron: "Розклад",
	bootstrap: "Запуск",
}

export const STEP_LABELS: Record<string, string> = {
	auditoriums: "Аудиторії",
	groups: "Групи",
	teachers: "Викладачі",
}

// ── Status variant ─────────────────────────────────────────────────────────────

export function statusVariant(
	status: SyncRun["status"] | DashSummary["currentStatus"]
): "success" | "warning" | "destructive" | "secondary" | "info" {
	switch (status) {
		case "success":
			return "success"
		case "partial":
			return "warning"
		case "failed":
			return "destructive"
		case "running":
			return "info"
		default:
			return "secondary"
	}
}

// ── Formatting ────────────────────────────────────────────────────────────────

/** dd.MM HH:mm — for collapsed run rows */
export function fmtShort(iso: string | null | undefined): string {
	if (!iso) return "—"
	return new Date(iso).toLocaleString("uk-UA", {
		day: "2-digit",
		month: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
	})
}

export function fmt(iso: string | null | undefined): string {
	if (!iso) return "—"
	return new Date(iso).toLocaleString("uk-UA", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
	})
}

export function fmtRelative(iso: string | null | undefined): string {
	if (!iso) return "—"
	const ms = Date.now() - new Date(iso).getTime()
	const s = Math.floor(ms / 1000)
	const m = Math.floor(s / 60)
	const h = Math.floor(m / 60)
	const d = Math.floor(h / 24)
	if (d > 0) return `${d} дн тому`
	if (h > 0) return `${h} год тому`
	if (m > 0) return `${m} хв тому`
	return `${s}с тому`
}

export function duration(start: string, end: string | null): string {
	if (!end) return "—"
	const ms = new Date(end).getTime() - new Date(start).getTime()
	const s = Math.floor(ms / 1000)
	const m = Math.floor(s / 60)
	const h = Math.floor(m / 60)
	if (h > 0) return `${h}г ${m % 60}хв`
	if (m > 0) return `${m}хв ${s % 60}с`
	return `${s}с`
}

/** Duration in ms for sparkbar scaling */
export function durationMs(start: string, end: string | null): number {
	if (!end) return 0
	return new Date(end).getTime() - new Date(start).getTime()
}

// ── Events delta ───────────────────────────────────────────────────────────────

export function deltaLabel(curr: number, prev: number | null): string {
	if (prev === null) return ""
	const diff = curr - prev
	if (diff === 0) return "="
	return diff > 0 ? `+${diff}` : String(diff)
}

export function deltaClass(curr: number, prev: number | null): string {
	if (prev === null) return "text-muted-foreground"
	const diff = curr - prev
	if (diff === 0) return "text-muted-foreground"
	return diff > 0 ? "text-green-600 dark:text-green-400" : "text-destructive"
}

// ── Spike detection ───────────────────────────────────────────────────────────

const REMOVED_SPIKE_RATIO = 0.05

export function isRemovedSpike(run: SyncRun): boolean {
	if (run.totalEvents === 0) return false
	return run.removedEvents / run.totalEvents > REMOVED_SPIKE_RATIO
}

// ── Group label ───────────────────────────────────────────────────────────────

export function groupLabel(g: Pick<SyncRunGroup, "groupId" | "groupName">): string {
	return g.groupName ?? `#${g.groupId}`
}
