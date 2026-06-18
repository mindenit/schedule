import { EVENT_TYPE_LABELS } from "~/constants/calendar"

// Derived from EVENT_TYPE_LABELS so the two never diverge.
export const FILTERS_LESSON_TYPES = Object.entries(EVENT_TYPE_LABELS).map(([id, name]) => ({
	id,
	name,
}))
