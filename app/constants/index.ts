export const SHOW_HIRING_BANNER = false

export const AUTHORS = [
	{
		name: "Роман Трашутін",
		role: "Frontend Developer",
		avatar: "/authors/roman.png",
		linkedin: "https://www.linkedin.com/in/roman-trashutin",
	},
	{
		name: "Кирило Савєльєв",
		role: "Backend Developer",
		avatar: "/authors/kyrylo.jpg",
		linkedin: "https://www.linkedin.com/in/kyrylo-savieliev",
	},
	{
		name: "Артем Дадаш'янц",
		role: "CEO / DevOps",
		avatar: "/authors/artem.jpg",
		linkedin: "https://www.linkedin.com/in/artem-dadashjants/",
	},
] as const

export const SWIPE_ANIMATION_CONFIG = {
	/** Animation variants for Motion */
	variants: {
		enter: (custom: unknown) => {
			const direction = custom as "left" | "right"
			return {
				x: direction === "left" ? "100%" : "-100%",
				opacity: 1,
			}
		},
		center: {
			x: "0%",
			opacity: 1,
		},
		exit: (custom: unknown) => {
			const direction = custom as "left" | "right"
			return {
				x: direction === "left" ? "-100%" : "100%",
				opacity: 1,
			}
		},
	},
} as const

/**
 * Spring transition that mimics native mobile feel.
 * stiffness + damping tuned to match iOS scroll-view deceleration.
 */
export const SWIPE_SPRING_TRANSITION = {
	type: "spring",
	stiffness: 300,
	damping: 30,
	mass: 0.8,
} as const

/**
 * Drag-to-commit thresholds shared by every swipe-enabled calendar view.
 *
 * `OFFSET_RATIO` — fraction of the viewport width the user must drag past for
 * the swipe to commit. 0.25 (25%) is a standard mobile UX target.
 *
 * `VELOCITY` — alternative commit gate (px/s). If the user releases at this
 * speed or faster, the swipe commits even before the offset threshold, so a
 * quick flick still navigates. 400 px/s matches typical iOS/Android list paging.
 */
export const SWIPE_COMMIT_OFFSET_RATIO = 0.25
export const SWIPE_COMMIT_VELOCITY = 400

export type SwipeDirection = "left" | "right"

export const CalendarAnimationUtils = {
	createDateKey(date: Date): string {
		return date.toISOString()
	},
}
