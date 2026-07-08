<script setup lang="ts">
const { trackEvent } = useAnalytics()

const isOpen = useState("settings:open", () => false)

function onOpenChange(open: boolean) {
	isOpen.value = open
	if (open) trackEvent("settings_opened")
}
</script>

<template>
	<UiDialog :open="isOpen" @update:open="onOpenChange">
		<UiDialogTrigger as-child>
			<UiButton size="icon" variant="ghost" aria-label="Налаштування">
				<AppIcon name="lucide:settings" />
			</UiButton>
		</UiDialogTrigger>
		<UiDialogContent class="flex max-h-[80vh] flex-col overflow-x-hidden sm:max-w-2xl">
			<UiDialogHeader>
				<UiDialogTitle class="flex items-center gap-2">
					<AppIcon name="lucide:settings" />
					Налаштування
				</UiDialogTitle>
				<UiDialogDescription
					>Керуйте розкладами, посиланнями та зовнішнім виглядом</UiDialogDescription
				>
			</UiDialogHeader>
			<SettingsMainView class="flex-1" />
		</UiDialogContent>
	</UiDialog>
</template>
