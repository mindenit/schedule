import type { GenericScheduleItem } from "~/types/schedule"

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
						localStorage.removeItem("selected-schedule")
					}
				} catch {
					localStorage.removeItem("selected-schedule")
				}
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
		if (!isInitialized.value) initializeStore()

		const existing = allSchedules.value.find(
			(s) => String(s.id) === String(schedule.id) && s.type === schedule.type
		)
		if (existing) {
			selectSchedule(existing)
			return
		}

		allSchedules.value.push(schedule)
		selectSchedule(schedule)
		saveAllSchedules()
	}

	const removeSchedule = (scheduleId: string | number) => {
		if (!isInitialized.value) initializeStore()

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

	// Select a schedule that came from a shared URL — sets it as active without
	// adding it to allSchedules or touching localStorage. The selection is
	// intentionally ephemeral: if the user wants to keep it they add it normally.
	const selectScheduleFromUrl = (schedule: GenericScheduleItem) => {
		selectedSchedule.value = schedule
	}

	// Defer until after Pinia SSR hydration so localStorage wins.
	if (import.meta.client) {
		nextTick(() => initializeStore())
	}

	return {
		allSchedules,
		selectedSchedule,
		isInitialized,
		addSchedule,
		removeSchedule,
		selectSchedule,
		selectScheduleFromUrl,
		initializeStore,
	}
})
