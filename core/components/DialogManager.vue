<script lang="ts" setup>
const { currentDialog, isDialogOpen, closeDialog, initializeDialogs } = useDialogManager()

onMounted(() => {
	initializeDialogs()
})
</script>

<template>
	<Dialog
		:open="isDialogOpen"
		@update:open="
			(val) => {
				if (!val) closeDialog()
			}
		"
	>
		<AppDialog v-if="currentDialog?.component === 'AppDialog'" />
	</Dialog>
</template>
