<script setup lang="ts">
import { useLinksStore } from "~/core/stores/links"

const linksStore = useLinksStore()
const showDialog = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

const handleExport = () => {
	linksStore.exportLinks()
}

const triggerImport = () => {
	fileInput.value?.click()
}

const handleImport = (event: Event) => {
	const target = event.target as HTMLInputElement
	const file = target.files?.[0]
	if (!file) return

	const reader = new FileReader()
	reader.onload = (e) => {
		const result = linksStore.importLinks(e.target?.result as string)
		if (!result.success) {
			alert(`Помилка імпорту: ${result.error}`)
		}
	}
	reader.readAsText(file)
}
</script>

<template>
	<Dialog v-model:open="showDialog">
		<DialogTrigger as-child>
			<slot />
		</DialogTrigger>
		<DialogContent>
			<DialogHeader>
				<DialogTitle>Керування посиланнями</DialogTitle>
				<DialogDescription> Імпорт та експорт ваших збережених посилань. </DialogDescription>
			</DialogHeader>
			<div class="flex flex-col gap-4 py-4">
				<Button @click="handleExport">
					<Icon name="lucide:upload" class="mr-2" />
					Експортувати посилання
				</Button>
				<Button @click="triggerImport">
					<Icon name="lucide:download" class="mr-2" />
					Імпортувати посилання
				</Button>
				<input type="file" ref="fileInput" @change="handleImport" accept=".json" class="hidden" />
			</div>
		</DialogContent>
	</Dialog>
</template>
