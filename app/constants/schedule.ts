export const SCHEDULE_ICONS: Record<string, string> = {
	group: "ph:users-three-bold",
	teacher: "ph:chalkboard-teacher-bold",
	auditorium: "ph:door-open-bold",
}

export const SCHEDULE_TYPES: Record<string, string> = {
	group: "Група",
	teacher: "Викладач",
	auditorium: "Аудиторія",
}

export const ITEMS_PER_PAGE = 20

export const getScheduleIcon = (type: string): string => SCHEDULE_ICONS[type] || "ph:calendar-bold"

export const getScheduleTypeLabel = (type: string): string => SCHEDULE_TYPES[type] || "Розклад"
