export const SCHEDULE_ICONS: Record<string, string> = {
	group: "lucide:users",
	teacher: "lucide:user-check",
	auditorium: "lucide:building",
}

export const SCHEDULE_TYPES: Record<string, string> = {
	group: "Група",
	teacher: "Викладач",
	auditorium: "Аудиторія",
}

export const ITEMS_PER_PAGE = 20

export const getScheduleIcon = (type: string): string => SCHEDULE_ICONS[type] || "lucide:calendar"

export const getScheduleTypeLabel = (type: string): string => SCHEDULE_TYPES[type] || "Розклад"
