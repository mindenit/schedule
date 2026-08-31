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
