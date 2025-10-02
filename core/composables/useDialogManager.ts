import { useLocalStorage } from "@vueuse/core"
import type { DialogConfig } from "../constants/dialogs"
import { DIALOGS_CONFIG } from "../constants/dialogs"

export const useDialogManager = () => {
	const shownDialogs = useLocalStorage<Record<string, { version: number; lastShown: string }>>(
		"shown-dialogs",
		{}
	)

	const currentDialog = ref<DialogConfig | null>(null)
	const isDialogOpen = ref(false)

	const shouldShowDialog = (dialog: DialogConfig): boolean => {
		if (!dialog.enabled) return false

		const shown = shownDialogs.value[dialog.id]

		if (!shown) return true

		if (shown.version < dialog.version) return true

		if (dialog.minShowInterval) {
			const lastShown = new Date(shown.lastShown)
			const daysSinceLastShown = (Date.now() - lastShown.getTime()) / (1000 * 60 * 60 * 24)
			return daysSinceLastShown >= dialog.minShowInterval
		}

		return false
	}

	const getNextDialog = (): DialogConfig | null => {
		const availableDialogs = DIALOGS_CONFIG.filter(shouldShowDialog).sort(
			(a, b) => a.priority - b.priority
		)

		return availableDialogs[0] || null
	}

	const showDialog = (dialog: DialogConfig) => {
		currentDialog.value = dialog
		isDialogOpen.value = true
	}

	const closeDialog = () => {
		if (currentDialog.value) {
			shownDialogs.value[currentDialog.value.id] = {
				version: currentDialog.value.version,
				lastShown: new Date().toISOString(),
			}
		}
		isDialogOpen.value = false
		currentDialog.value = null

		const nextDialog = getNextDialog()
		if (nextDialog) {
			setTimeout(() => showDialog(nextDialog), 500)
		}
	}

	const initializeDialogs = () => {
		const nextDialog = getNextDialog()
		if (nextDialog) {
			showDialog(nextDialog)
		}
	}

	const resetDialog = (dialogId: string) => {
		const { [dialogId]: removed, ...rest } = shownDialogs.value
		shownDialogs.value = rest
	}

	const resetAllDialogs = () => {
		shownDialogs.value = {}
	}

	const forceShowDialog = (dialogId: string) => {
		const dialog = DIALOGS_CONFIG.find((d) => d.id === dialogId)
		if (dialog && dialog.enabled) {
			showDialog(dialog)
		}
	}

	return {
		currentDialog: readonly(currentDialog),
		isDialogOpen: readonly(isDialogOpen),
		closeDialog,
		initializeDialogs,
		resetDialog,
		resetAllDialogs,
		forceShowDialog,
	}
}
