<script setup lang="ts">
const showDialog = ref(false)
const currentView = ref<"main" | "links" | "export-tree">("main")

const handleViewChange = (view: typeof currentView.value) => {
	currentView.value = view
}

const goBack = () => {
	currentView.value = "main"
}
</script>

<template>
	<Dialog v-model:open="showDialog">
		<DialogTrigger as-child>
			<Button size="icon" variant="outline">
				<Icon name="lucide:settings" class="!size-4" />
			</Button>
		</DialogTrigger>
		<DialogContent class="flex max-h-[80vh] max-w-2xl flex-col overflow-hidden">
			<DialogHeader>
				<DialogTitle>Налаштування</DialogTitle>
			</DialogHeader>
			<SettingsMainView v-if="currentView === 'main'" @navigate="handleViewChange" />
			<SettingsLinksManagement v-else-if="currentView === 'links'" @back="goBack" />
			<SettingsExportTree v-else-if="currentView === 'export-tree'" @back="goBack" />
		</DialogContent>
	</Dialog>
</template>
