<template>
	<TreeItem v-slot="slotProps" v-bind="forwarded">
		<slot v-bind="slotProps" />
	</TreeItem>
</template>

<script lang="ts" setup generic="T extends Record<string, any>">
// @ts-nocheck
// NOTE: @ts-nocheck is intentional. reka-ui@2.9.x + vue-tsc produce a VLS generic-constraint
// mismatch when useForwardPropsEmits(props, emit) is passed to <TreeItem v-bind>. This is an
// upstream type bug — no runtime impact. Remove when reka-ui fixes TreeItem generics.
import { TreeItem, useForwardPropsEmits } from "reka-ui"
import type { TreeItemEmits, TreeItemProps } from "reka-ui"

const props = defineProps<TreeItemProps<T>>()
const emit = defineEmits<TreeItemEmits<T>>()

const forwarded = useForwardPropsEmits(props, emit)
</script>
