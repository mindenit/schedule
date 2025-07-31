import type { GenericScheduleItem } from "../types"

export const useScheduleStore = defineStore("schedule", () => {
	const allSchedules = ref<GenericScheduleItem[]>([])
	const selectedSchedule = ref<GenericScheduleItem | null>(null)
	const isInitialized = ref(false)

	const initializeStore = () => {
		if (import.meta.client && !isInitialized.value) {
			const savedSchedules = localStorage.getItem("all-schedules")
			if (savedSchedules) {
				try {
					const parsed = JSON.parse(savedSchedules)
					allSchedules.value = Array.isArray(parsed) ? parsed : []
				} catch {
					localStorage.removeItem("all-schedules")
					allSchedules.value = []
				}
			} else {
				allSchedules.value = []
			}

			const savedSchedule = localStorage.getItem("selected-schedule")
			if (savedSchedule) {
				try {
					const parsed = JSON.parse(savedSchedule)
					const existsInAll = allSchedules.value.find(
						(s) => String(s.id) === String(parsed.id) && s.type === parsed.type
					)

					if (existsInAll) {
						selectedSchedule.value = parsed
					} else {
						console.warn("Selected schedule not found in all schedules, clearing")
						localStorage.removeItem("selected-schedule")
						selectedSchedule.value = null
					}
				} catch (error) {
					console.error("Error parsing saved schedule:", error)
					localStorage.removeItem("selected-schedule")
					selectedSchedule.value = null
				}
			} else {
				selectedSchedule.value = null
			}

			isInitialized.value = true
		}
	}

	const saveAllSchedules = () => {
		if (import.meta.client && isInitialized.value) {
			localStorage.setItem("all-schedules", JSON.stringify(allSchedules.value))
		}
	}

	const addSchedule = (schedule: GenericScheduleItem) => {
		if (!isInitialized.value) {
			initializeStore()
		}

		const existingSchedule = allSchedules.value.find(
			(s) => String(s.id) === String(schedule.id) && s.type === schedule.type
		)

		if (existingSchedule) {
			console.warn("Schedule has already been added:", schedule)
			selectSchedule(existingSchedule)
			return
		}

		allSchedules.value.push(schedule)
		selectSchedule(schedule)
		saveAllSchedules()
	}

	const removeSchedule = (scheduleId: string | number) => {
		if (!isInitialized.value) {
			initializeStore()
		}

		const scheduleIdStr = String(scheduleId)
		allSchedules.value = allSchedules.value.filter((s) => String(s.id) !== scheduleIdStr)

		if (selectedSchedule.value && String(selectedSchedule.value.id) === scheduleIdStr) {
			selectedSchedule.value = allSchedules.value[0] ?? null

			if (import.meta.client) {
				if (selectedSchedule.value) {
					localStorage.setItem("selected-schedule", JSON.stringify(selectedSchedule.value))
				} else {
					localStorage.removeItem("selected-schedule")
				}
			}
		}

		saveAllSchedules()
	}

	const selectSchedule = (schedule: GenericScheduleItem) => {
		selectedSchedule.value = schedule
		if (import.meta.client && isInitialized.value) {
			localStorage.setItem("selected-schedule", JSON.stringify(schedule))
		}
	}

	if (import.meta.client) {
		nextTick(() => {
			initializeStore()
		})
	}

	return {
		allSchedules: readonly(allSchedules),
		selectedSchedule: readonly(selectedSchedule),
		isInitialized: readonly(isInitialized),
		addSchedule,
		removeSchedule,
		selectSchedule,
		initializeStore,
	}
})
