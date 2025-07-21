<script setup lang="ts">
import type { Subject } from "nurekit"
import { ref, computed } from "vue"
import { useLinksStore, type Link } from "~/core/stores/links"

const linksStore = useLinksStore()
const showDialog = ref(false)
const showExportTree = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

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

const generateTreeData = () => {
	console.log("Links store data:", linksStore.links)
	const tree: TreeNode[] = []

	if (!linksStore.links || Object.keys(linksStore.links).length === 0) {
		console.log("No links data available")
		return tree
	}

	Object.entries(linksStore.links).forEach(([subjectId, subjectData]) => {
		console.log(`Processing subject ${subjectId}:`, subjectData)

		const subjectInfo = subjectData.subject
		const subjectTitle = subjectInfo.title || `Предмет ${subjectId}`
		const subjectLabel = subjectInfo.brief ? `(${subjectInfo.brief}) ${subjectTitle}` : subjectTitle

		const subjectNode: TreeNode = {
			id: `subject-${subjectId}`,
			label: subjectLabel,
			type: "subject",
			checked: false,
			indeterminate: false,
			children: [],
			data: { subjectId, subject: subjectInfo },
		}

		if (subjectData.events && typeof subjectData.events === "object") {
			Object.entries(subjectData.events).forEach(([eventType, links]) => {
				console.log(`Processing event type ${eventType}:`, links)

				const eventTypeNode: TreeNode = {
					id: `${subjectId}-${eventType}`,
					label: eventType,
					type: "eventType",
					checked: false,
					indeterminate: false,
					children: [],
					data: { subjectId, eventType },
				}

				if (Array.isArray(links)) {
					links.forEach((link) => {
						console.log(`Processing link:`, link)

						const linkNode: TreeNode = {
							id: `${subjectId}-${eventType}-${link.id}`,
							label: link.name || link.url || "Безіменне посилання",
							type: "link",
							checked: false,
							indeterminate: false,
							data: { subjectId, eventType, link },
						}

						eventTypeNode.children!.push(linkNode)
					})
				}

				if (eventTypeNode.children!.length > 0) {
					subjectNode.children!.push(eventTypeNode)
				}
			})
		}

		if (subjectNode.children!.length > 0) {
			tree.push(subjectNode)
		}
	})

	console.log("Generated tree:", tree)
	return tree
}

const updateNodeState = (node: TreeNode) => {
	if (node.children && node.children.length > 0) {
		const checkedChildren = node.children.filter((child) => child.checked)
		const indeterminateChildren = node.children.filter((child) => child.indeterminate)

		if (checkedChildren.length === node.children.length) {
			node.checked = true
			node.indeterminate = false
		} else if (checkedChildren.length > 0 || indeterminateChildren.length > 0) {
			node.checked = false
			node.indeterminate = true
		} else {
			node.checked = false
			node.indeterminate = false
		}
	}
}

const updateParentNodes = (tree: TreeNode[]) => {
	const updateParents = (nodes: TreeNode[]) => {
		nodes.forEach((node) => {
			if (node.children && node.children.length > 0) {
				updateParents(node.children)
				updateNodeState(node)
			}
		})
	}
	updateParents(tree)
}

const handleNodeCheck = (node: TreeNode, checked: boolean) => {
	node.checked = checked
	node.indeterminate = false

	const updateChildren = (n: TreeNode, state: boolean) => {
		n.checked = state
		n.indeterminate = false
		if (n.children) {
			n.children.forEach((child) => updateChildren(child, state))
		}
	}

	if (node.children) {
		node.children.forEach((child) => updateChildren(child, checked))
	}

	updateParentNodes(treeData.value)
}

const getSelectedData = () => {
	const result: Record<string, { subject: Subject; events: Record<string, Link[]> }> = {}

	const collectSelected = (nodes: TreeNode[]) => {
		nodes.forEach((node) => {
			if (node.type === "link" && node.checked && node.data?.link) {
				const { subjectId, eventType, link } = node.data
				if (subjectId && eventType && link) {
					if (!result[subjectId]) {
						const subjectInfo = findSubjectInfo(subjectId)
						result[subjectId] = {
							subject: subjectInfo || {
								id: parseInt(subjectId),
								title: `Предмет ${subjectId}`,
								brief: "",
							},
							events: {},
						}
					}
					if (!result[subjectId].events[eventType]) {
						result[subjectId].events[eventType] = []
					}
					result[subjectId].events[eventType].push(link)
				}
			} else if (node.children) {
				collectSelected(node.children)
			}
		})
	}

	const findSubjectInfo = (subjectId: string): Subject | null => {
		const findInTree = (nodes: TreeNode[]): Subject | null => {
			for (const node of nodes) {
				if (node.type === "subject" && node.data?.subjectId === subjectId && node.data?.subject) {
					return node.data.subject
				}
				if (node.children) {
					const found = findInTree(node.children)
					if (found) return found
				}
			}
			return null
		}
		return findInTree(treeData.value)
	}

	collectSelected(treeData.value)
	return result
}

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
	showExportTree.value = false
}

const showExportTreeView = () => {
	treeData.value = generateTreeData()
	showExportTree.value = true
}

const selectAll = () => {
	const updateAll = (nodes: TreeNode[]) => {
		nodes.forEach((node) => {
			node.checked = true
			node.indeterminate = false
			if (node.children) {
				updateAll(node.children)
			}
		})
	}
	updateAll(treeData.value)
}

const deselectAll = () => {
	const updateAll = (nodes: TreeNode[]) => {
		nodes.forEach((node) => {
			node.checked = false
			node.indeterminate = false
			if (node.children) {
				updateAll(node.children)
			}
		})
	}
	updateAll(treeData.value)
}

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
		} else {
			if (showExportTree.value) {
				treeData.value = generateTreeData()
			}
		}
	}
	reader.readAsText(file)
}

const renderTreeNode = (node: TreeNode, level: number = 0) => {
	const marginLeft = level * 16
	return {
		node,
		level,
		marginLeft,
	}
}

const flatTreeData = computed(() => {
	const result: Array<{ node: TreeNode; level: number; marginLeft: number }> = []

	const flatten = (nodes: TreeNode[], level: number = 0) => {
		nodes.forEach((node) => {
			result.push(renderTreeNode(node, level))
			if (node.children && node.children.length > 0) {
				flatten(node.children, level + 1)
			}
		})
	}

	flatten(treeData.value)
	return result
})
</script>

<template>
	<Dialog v-model:open="showDialog">
		<DialogTrigger as-child>
			<slot />
		</DialogTrigger>
		<DialogContent class="max-w-2xl">
			<DialogHeader>
				<DialogTitle>Керування посиланнями</DialogTitle>
				<DialogDescription> Імпорт та експорт ваших збережених посилань. </DialogDescription>
			</DialogHeader>

			<div v-if="!showExportTree" class="flex flex-col gap-4 py-4">
				<Button @click="handleExport">
					<Icon name="lucide:upload" />
					Експортувати всі посилання
				</Button>

				<Button variant="outline" @click="showExportTreeView">
					<Icon name="lucide:tree-pine" />
					Вибірковий експорт
				</Button>

				<Button @click="triggerImport">
					<Icon name="lucide:download" />
					Імпортувати посилання
				</Button>
				<input ref="fileInput" type="file" class="hidden" accept=".json" @change="handleImport" />
			</div>

			<div v-else class="py-4">
				<div class="mb-4 flex items-center justify-between">
					<h3 class="text-lg font-medium">Оберіть дані для експорту</h3>
					<div class="flex gap-2">
						<Button size="sm" variant="outline" @click="selectAll"> Вибрати все </Button>
						<Button size="sm" variant="outline" @click="deselectAll"> Зняти вибір </Button>
					</div>
				</div>

				<div class="max-h-80 overflow-y-auto rounded-md border p-4">
					<div v-if="flatTreeData.length === 0" class="py-8 text-center text-gray-500">
						Немає збережених посилань для експорту
						<div class="mt-2 text-xs">
							Debug: {{ Object.keys(linksStore.links).length }} subject(s) in store
						</div>
					</div>

					<div
						v-for="item in flatTreeData"
						:key="item.node.id"
						class="flex items-center gap-2 py-1"
						:style="{ marginLeft: item.marginLeft + 'px' }"
					>
						<input
							type="checkbox"
							:checked="item.node.checked"
							:class="{ 'opacity-50': item.node.indeterminate }"
							@change="handleNodeCheck(item.node, ($event.target as HTMLInputElement).checked)"
						/>
						<Icon
							:name="
								item.node.type === 'subject'
									? 'lucide:book'
									: item.node.type === 'eventType'
										? 'lucide:calendar'
										: 'lucide:link'
							"
							class="!size-4"
						/>
						<span class="text-sm">{{ item.node.label }}</span>
					</div>
				</div>

				<div class="flex justify-between pt-4">
					<Button variant="outline" @click="showExportTree = false">
						<Icon name="lucide:arrow-left" />
						Назад
					</Button>
					<Button @click="handleExportSelected">
						<Icon name="lucide:download" />
						Експортувати вибране
					</Button>
				</div>
			</div>
		</DialogContent>
	</Dialog>
</template>
