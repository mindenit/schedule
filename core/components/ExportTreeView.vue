<script setup lang="ts">
interface TreeNode {
	id: string
	label: string
	type: "subject" | "eventType" | "link"
	checked: boolean
	indeterminate: boolean
	children?: TreeNode[]
	data?: any
}

interface Props {
	flatTreeData: Array<{ node: TreeNode; level: number; marginLeft: number }>
}

defineProps<Props>()

const emit = defineEmits<{
	nodeCheck: [node: TreeNode, checked: boolean]
}>()
</script>

<template>
	<div class="flex-1 overflow-y-auto rounded-md border p-4">
		<div v-if="flatTreeData.length === 0" class="py-8 text-center text-gray-500">
			Немає збережених посилань для експорту
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
				@change="emit('nodeCheck', item.node, ($event.target as HTMLInputElement).checked)"
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
</template>
