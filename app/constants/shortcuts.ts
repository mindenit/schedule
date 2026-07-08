/**
 * Keyboard shortcut definitions — single source of truth.
 *
 * Each entry is consumed by:
 *   - useKeyboardShortcuts() → registers the handler
 *   - AppShortcutsDialog    → renders the help table with UiKbd
 *
 * To add a new shortcut: add an entry here and handle the key in
 * useKeyboardShortcuts.ts.
 */
export const KEYBOARD_SHORTCUTS = [
	{
		key: "ArrowLeft",
		label: "Попередній період",
		keys: ["←"],
	},
	{
		key: "ArrowRight",
		label: "Наступний період",
		keys: ["→"],
	},
	{
		key: "t",
		label: "Сьогодні",
		keys: ["T"],
	},
	{
		key: "d",
		label: "Вигляд: День",
		keys: ["D"],
	},
	{
		key: "w",
		label: "Вигляд: Тиждень",
		keys: ["W"],
	},
	{
		key: "m",
		label: "Вигляд: Місяць",
		keys: ["M"],
	},
	{
		key: "y",
		label: "Вигляд: Рік",
		keys: ["Y"],
	},
	{
		key: "?",
		label: "Показати shortcuts",
		keys: ["?"],
	},
] as const

export type TShortcutKey = (typeof KEYBOARD_SHORTCUTS)[number]["key"]
