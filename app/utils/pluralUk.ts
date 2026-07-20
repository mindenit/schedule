/**
 * Ukrainian grammatical plural selector.
 *
 * Ukrainian requires three forms:
 *   one  — 1, 21, 31 … (mod10 === 1, but not 11)
 *   few  — 2–4, 22–24 … (mod10 === 2–4, but not 12–14)
 *   many — 0, 5–20, 25–30 … (everything else)
 *
 * Examples:
 *   1 посилання, 2 посилання, 5 посилань, 11 посилань, 21 посилання
 *   1 заняття,   3 заняття,   7 занять,   11 занять,   21 заняття
 */
export function pluralUk(n: number, one: string, few: string, many: string): string {
	const mod10 = n % 10
	const mod100 = n % 100
	if (mod100 >= 11 && mod100 <= 14) return many
	if (mod10 === 1) return one
	if (mod10 >= 2 && mod10 <= 4) return few
	return many
}
