export interface DialogConfig {
	id: string
	version: number
	priority: number // Lower number means higher priority
	enabled: boolean
	component: string
	minShowInterval?: number
}

export const DIALOGS_CONFIG: DialogConfig[] = [
	{
		id: "app-promotion",
		version: 1,
		priority: 2,
		enabled: true,
		component: "AppDialog",
	},
]
