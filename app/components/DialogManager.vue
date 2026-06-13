<script lang="ts" setup>
const { currentDialog, isDialogOpen, closeDialog, initializeDialogs } = useDialogManager()

onMounted(() => {
	initializeDialogs()
})
</script>

<template>
	<UiDialog
		:open="isDialogOpen"
		@update:open="
			(val) => {
				if (!val) closeDialog()
			}
		"
	>
		<AppDialog v-if="currentDialog?.component === 'AppDialog'" />
	</UiDialog>
</template>
