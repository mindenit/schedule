<script lang="ts" setup>
const open = defineModel<boolean>("open", { required: true })
</script>

<template>
	<UiDialog v-model:open="open">
		<UiDialogContent class="sm:max-w-sm">
			<UiDialogHeader>
				<UiDialogTitle class="flex items-center gap-2">
					<AppIcon name="lucide:keyboard" />
					Клавіатурні скорочення
				</UiDialogTitle>
				<UiDialogDescription>Швидка навігація по календарю</UiDialogDescription>
			</UiDialogHeader>

			<div class="flex flex-col gap-1">
				<div
					v-for="shortcut in KEYBOARD_SHORTCUTS"
					:key="shortcut.key"
					class="flex items-center justify-between gap-4 rounded-md px-2 py-1.5"
				>
					<span class="text-sm">{{ shortcut.label }}</span>
					<UiKbdGroup>
						<UiKbd v-for="k in shortcut.keys" :key="k">{{ k }}</UiKbd>
					</UiKbdGroup>
				</div>
			</div>

			<UiDialogFooter>
				<p class="text-muted-foreground w-full text-center text-xs">
					Скорочення не працюють, коли відкрито діалог
				</p>
			</UiDialogFooter>
		</UiDialogContent>
	</UiDialog>
</template>
