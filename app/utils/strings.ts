/**
 * Pure string utilities.
 *
 * Exported as plain functions (not a composable) and auto-imported by Nuxt
 * via the `app/utils/` directory. Keeping them here avoids dragging date-fns,
 * timezone, and nurekit imports into anything that just needs to title-case
 * a label or get user-initials.
 */

/**
 * Uppercases the first character of a string.
 * Returns "" for empty/falsy input.
 */
export function capitalize(str: string): string {
	if (!str) return ""
	return str.charAt(0).toUpperCase() + str.slice(1)
}

/**
 * Returns up to the first two uppercase initials of a (whitespace-separated)
 * string. Useful for avatar fallbacks.
 *
 * Examples:
 *   getFirstLetters("Ivan")        -> "I"
 *   getFirstLetters("Ivan Petrov") -> "IP"
 *   getFirstLetters("")            -> ""
 */
export function getFirstLetters(str: string): string {
	if (!str) return ""
	const words = str.split(" ")
	if (words.length === 1 && words[0]) return words[0].charAt(0).toUpperCase()
	return `${words[0]?.charAt(0).toUpperCase() ?? ""}${words[1]?.charAt(0).toUpperCase() ?? ""}`
}
