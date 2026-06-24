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

/**
 * Tween transition for swipe/keyboard/button navigation.
 * 280ms with standard iOS ease-out cubic — fast enough to feel snappy,
 * long enough that the motion reads as navigation and not a jump.
 * Chosen over a spring because the spring's overshoot adds ~300ms of
 * visible wobble on every nav and taxes the compositor with 504-cell
 * year-view panels.
 */
export const SWIPE_TWEEN_TRANSITION = {
	type: "tween",
	duration: 0.28,
	ease: [0.32, 0.72, 0, 1],
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
