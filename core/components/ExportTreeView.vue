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

const props = defineProps<Props>()

const emit = defineEmits<{
	nodeCheck: [node: TreeNode, checked: boolean]
}>()

watch(
	() => props.flatTreeData,
	() => {
		nextTick(() => {
			updateIndeterminateStates()
		})
	},
	{ deep: true }
)

const updateIndeterminateStates = () => {
	props.flatTreeData.forEach((item) => {
		const checkbox = document.querySelector(
			`input[data-node-id="${item.node.id}"]`
		) as HTMLInputElement
		if (checkbox) {
			checkbox.indeterminate = item.node.indeterminate
		}
	})
}
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
				:data-node-id="item.node.id"
				type="checkbox"
				:checked="item.node.checked"
				class="peer border-input data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground
					data-[state=checked]:border-primary focus-visible:border-ring focus-visible:ring-ring/50
					accent-primary size-4 shrink-0 rounded-[4px] border shadow-xs transition-shadow outline-none
					focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
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
			<label :for="item.node.id" class="cursor-pointer text-sm select-none">
				{{ item.node.label }}
			</label>
		</div>
	</div>
</template>
