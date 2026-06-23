import { defineStore, skipHydrate } from "pinia"
import { useStorage } from "@vueuse/core"
import type { GenericScheduleItem } from "~/types/schedule"
import { STORAGE_KEYS } from "~/constants/storage"

const sameSchedule = (a: GenericScheduleItem, b: GenericScheduleItem) =>
	String(a.id) === String(b.id) && a.type === b.type

export const useScheduleStore = defineStore("schedule", () => {
	const allSchedules = skipHydrate(
		useStorage<GenericScheduleItem[]>(STORAGE_KEYS.schedules, [])
	)
	const selectedSchedule = skipHydrate(
		useStorage<GenericScheduleItem | null>(STORAGE_KEYS.selectedSchedule, null, undefined, {
			// Allow `null` to round-trip through localStorage.
			serializer: {
				read: (raw) => {
					try {
						return JSON.parse(raw) as GenericScheduleItem | null
					} catch {
						return null
					}
				},
				write: (value) => JSON.stringify(value),
			},
		})
	)

	// Guarantee selectedSchedule still exists in allSchedules. If it was removed
	// from another tab we drop the dangling reference.
	if (import.meta.client) {
		nextTick(() => {
			if (
				selectedSchedule.value &&
				!allSchedules.value.some((s) => sameSchedule(s, selectedSchedule.value!))
			) {
				selectedSchedule.value = null
			}
		})
	}

	const addSchedule = (schedule: GenericScheduleItem) => {
		const existing = allSchedules.value.find((s) => sameSchedule(s, schedule))
		if (existing) {
			selectedSchedule.value = existing
			return
		}
		allSchedules.value.push(schedule)
		selectedSchedule.value = schedule
	}

	const removeSchedule = (scheduleId: string | number) => {
		const idStr = String(scheduleId)
		allSchedules.value = allSchedules.value.filter((s) => String(s.id) !== idStr)
		if (selectedSchedule.value && String(selectedSchedule.value.id) === idStr) {
			selectedSchedule.value = allSchedules.value[0] ?? null
		}
	}

	const selectSchedule = (schedule: GenericScheduleItem) => {
		selectedSchedule.value = schedule
	}

	// Selecting from a shared URL doesn't mutate allSchedules — the selection
	// is ephemeral until the user confirms via ScheduleEphemeralBanner.
	const selectScheduleFromUrl = (schedule: GenericScheduleItem) => {
		selectedSchedule.value = schedule
	}

	// True when the active schedule is not yet saved (came from a shared URL).
	const isEphemeralActive = computed(
		() =>
			selectedSchedule.value !== null &&
			!allSchedules.value.some((s) => sameSchedule(s, selectedSchedule.value!))
	)

	// `useStorage` reads synchronously on the client. We expose `isInitialized`
	// for parity with the previous API — consumers that gated on it (sidebar,
	// share page, url-state) still work without changes.
	const isInitialized = computed(() => import.meta.client)

	return {
		allSchedules,
		selectedSchedule,
		isInitialized,
		isEphemeralActive,
		addSchedule,
		removeSchedule,
		selectSchedule,
		selectScheduleFromUrl,
	}
})
