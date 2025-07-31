import { computed, type Ref } from "vue"
import type { Link } from "~/core/stores/links"
import type { Subject } from "nurekit"

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

export const useExportTree = (
	treeData: Ref<TreeNode[]>,
	linksStore: ReturnType<typeof useLinksStore>
) => {
	const generateTreeData = (): TreeNode[] => {
		const tree: TreeNode[] = []

		if (!linksStore.links || Object.keys(linksStore.links).length === 0) {
			return tree
		}

		Object.entries(linksStore.links).forEach(([subjectId, subjectData]) => {
			const subjectInfo = subjectData.subject
			const subjectTitle = subjectInfo.title || `Предмет ${subjectId}`
			const subjectLabel = subjectInfo.brief
				? `(${subjectInfo.brief}) ${subjectTitle}`
				: subjectTitle

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

	return {
		generateTreeData,
		updateParentNodes,
		handleNodeCheck,
		selectAll,
		deselectAll,
		getSelectedData,
		flatTreeData,
	}
}
