import type { DialogConfig } from "~/types/dialogs"

export type { DialogConfig }

export const DIALOGS_CONFIG: DialogConfig[] = [
	{
		id: "app-promotion",
		version: 1,
		priority: 2,
		enabled: true,
		component: "AppDialog",
	},
]

/** useState keys for cross-component dialog open state. */
export const DIALOG_KEYS = {
	settings: "settings:open",
	shortcuts: "shortcuts:open",
	scheduleAdd: "schedule:add-dialog:open",
} as const
