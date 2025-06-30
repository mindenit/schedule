import type { GenericScheduleItem } from "../types"

export const useScheduleStore = defineStore("schedule", () => {
	const allSchedules = ref<GenericScheduleItem[]>([])
	const selectedSchedule = ref<GenericScheduleItem | null>(null)

	const initializeStore = () => {
		if (import.meta.client) {
			const savedSchedule = localStorage.getItem("selected-schedule")
			if (savedSchedule) {
				try {
					selectedSchedule.value = JSON.parse(savedSchedule)
				} catch (error) {
					console.error("Error parsing saved schedule:", error)
					localStorage.removeItem("selected-schedule")
				}
			}

			const savedSchedules = localStorage.getItem("all-schedules")
			if (savedSchedules) {
				try {
					allSchedules.value = JSON.parse(savedSchedules)
				} catch (error) {
					console.error("Error parsing all schedules:", error)
					localStorage.removeItem("all-schedules")
				}
			}
		}
	}

	const saveAllSchedules = () => {
		if (import.meta.client) {
			localStorage.setItem("all-schedules", JSON.stringify(allSchedules.value))
		}
	}

	const addSchedule = (schedule: GenericScheduleItem) => {
		const existingSchedule = allSchedules.value.find(
			(s) => String(s.id) === String(schedule.id) && s.type === schedule.type
		)

		if (existingSchedule) {
			console.warn("Schedule has already been added:", schedule)
			selectSchedule(existingSchedule)
			return
		}

		allSchedules.value.push(schedule)
		selectedSchedule.value = schedule

		if (import.meta.client) {
			localStorage.setItem("selected-schedule", JSON.stringify(schedule))
			saveAllSchedules()
		}
	}

	const removeSchedule = (scheduleId: string | number) => {
		const scheduleIdStr = String(scheduleId)
		allSchedules.value = allSchedules.value.filter((s) => String(s.id) !== scheduleIdStr)

		if (String(selectedSchedule.value?.id) === scheduleIdStr) {
			selectedSchedule.value =
				allSchedules.value.length > 0 ? (allSchedules.value[0] ?? null) : null

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
		if (import.meta.client) {
			localStorage.setItem("selected-schedule", JSON.stringify(schedule))
		}
	}

	initializeStore()

	return {
		allSchedules,
		selectedSchedule,
		addSchedule,
		removeSchedule,
		selectSchedule,
	}
})
