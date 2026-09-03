/**
 * Returns the academic year date range covering the given date.
 * Academic year: Sept 1 → Sept 1. Padded ±7 days so month/week grid cells
 * that overhang the boundary (up to 6 days in either direction) still have
 * events fetched.
 */
export const getAcademicYearRange = (date: Date) => {
	const startYear = date.getMonth() < 8 ? date.getFullYear() - 1 : date.getFullYear()
	return {
		start: new Date(startYear, 8, 1 - 7, 0, 0, 0, 0),
		end: new Date(startYear + 1, 8, 1 + 7, 23, 59, 59, 999),
	}
}
