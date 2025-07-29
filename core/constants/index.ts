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
	/**
	 * Варианты анимации для Motion
	 */
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

	/**
	 * Общий transition объект
	 */
	transition: {
		duration: 0.25,
		type: "tween",
	},

	/**
	 * Длительность анимации в миллисекундах (для setTimeout)
	 */
	duration: 300,

	/**
	 * Длительность анимации в секундах (для CSS/Motion)
	 */
	durationSeconds: 0.25,
} as const

export const SWIPE_ANIMATION_TRANSITION = {
	duration: 0.25,
	ease: [0.42, 0, 0.58, 1],
} as const

export type SwipeDirection = "left" | "right"

export const CalendarAnimationUtils = {
	getAnimationDirection(
		navigationDirection: "next" | "previous",
		swipeDirection: SwipeDirection
	): SwipeDirection {
		if (navigationDirection === "next") {
			return swipeDirection === "left" ? "left" : "right"
		} else {
			return swipeDirection === "right" ? "right" : "left"
		}
	},

	createDateKey(date: Date): string {
		return date.toISOString()
	},
}
