<script setup lang="ts">
import { toast } from "vue-sonner"
import { useLinksStore, type Link } from "~/core/stores/links"
import type { Subject } from "nurekit"

const emit = defineEmits<{
	back: []
}>()

const linksStore = useLinksStore()

interface TreeNode {
	id: string
	label: string
	type: "subject" | "eventType" | "link"
	checked: boolean
	indeterminate: boolean
	children?: TreeNode[]
	data?: {
		subjectId?: string
		eventType?: string
		link?: Link
		subject?: Subject
	}
}

const treeData = ref<TreeNode[]>([])

const { generateTreeData, handleNodeCheck, selectAll, deselectAll, getSelectedData, flatTreeData } =
	useExportTree(treeData, linksStore)

const handleExportSelected = () => {
	const selectedData = getSelectedData()
	const dataStr = JSON.stringify(selectedData, null, 2)
	const blob = new Blob([dataStr], { type: "application/json" })
	const url = URL.createObjectURL(blob)
	const a = document.createElement("a")
	a.href = url
	a.download = `schedule-links-selected-${new Date().toISOString().split("T")[0]}.json`
	document.body.appendChild(a)
	a.click()
	document.body.removeChild(a)
	URL.revokeObjectURL(url)

	toast.success("Експорт завершено", {
		description: "Вибрані посилання успішно експортовано",
	})

	emit("back")
}

onMounted(() => {
	treeData.value = generateTreeData()
})
</script>

<template>
	<div class="flex flex-col overflow-hidden py-4">
		<div class="mb-4 flex items-center justify-between">
			<h3 class="text-lg font-medium">Оберіть дані для експорту</h3>
			<div class="flex gap-2">
				<Button size="sm" variant="outline" @click="selectAll"> Вибрати все </Button>
				<Button size="sm" variant="outline" @click="deselectAll"> Зняти вибір </Button>
			</div>
		</div>

		<ExportTreeView :flat-tree-data="flatTreeData" @node-check="handleNodeCheck" />

		<div class="flex justify-between border-t pt-4">
			<Button variant="outline" @click="emit('back')">
				<Icon name="lucide:arrow-left" />
				Назад
			</Button>
			<Button @click="handleExportSelected">
				<Icon name="lucide:download" />
				Експортувати вибране
			</Button>
		</div>
	</div>
</template>
