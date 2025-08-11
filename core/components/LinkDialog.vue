<script setup lang="ts">
import { ref, watch, computed } from "vue"
import type { Link } from "~/core/stores/links"

interface Props {
	modelValue: boolean
	link?: Link | null
}

const props = withDefaults(defineProps<Props>(), {
	modelValue: false,
	link: null,
})

const emit = defineEmits(["update:modelValue", "save"])
const { t } = useI18n()

const internalLink = ref<Partial<Link>>({ url: "", name: "" })

const isOpen = computed({
	get: () => props.modelValue,
	set: (value) => emit("update:modelValue", value),
})

watch(isOpen, (open) => {
	if (open) {
		internalLink.value = { ...(props.link || { url: "", name: "" }) }
	}
})

const save = () => {
	emit("save", internalLink.value)
	isOpen.value = false
}
</script>

<template>
	<Dialog v-model:open="isOpen">
		<DialogContent>
			<DialogHeader>
				<DialogTitle>{{ t(link ? 'links.edit_link' : 'links.add_link') }}</DialogTitle>
				<DialogDescription>
					{{ t('links.dialog_description') }}
				</DialogDescription>
			</DialogHeader>
			<div class="grid gap-4">
				<div class="grid w-full items-center gap-1.5">
					<Label for="url">{{ t('links.url') }}</Label>
					<Input id="url" v-model="internalLink.url" placeholder="https://..." />
				</div>
				<div class="grid w-full items-center gap-1.5">
					<Label for="name">{{ t('links.name') }}</Label>
					<Input id="name" v-model="internalLink.name" :placeholder="t('links.optional')" />
				</div>
			</div>
			<DialogFooter>
				<Button type="submit" @click="save">{{ t('links.save') }}</Button>
			</DialogFooter>
		</DialogContent>
	</Dialog>
</template>
