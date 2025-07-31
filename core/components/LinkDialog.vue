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
				<DialogTitle>{{ link ? "Редагувати" : "Додати" }} посилання</DialogTitle>
				<DialogDescription>
					Вставте посилання та, за бажанням, вкажіть його назву.
				</DialogDescription>
			</DialogHeader>
			<div class="grid gap-4">
				<div class="grid w-full items-center gap-1.5">
					<Label for="url">URL</Label>
					<Input id="url" v-model="internalLink.url" placeholder="https://..." />
				</div>
				<div class="grid w-full items-center gap-1.5">
					<Label for="name">Назва</Label>
					<Input id="name" v-model="internalLink.name" placeholder="(необов'язково)" />
				</div>
			</div>
			<DialogFooter>
				<Button type="submit" @click="save">Зберегти</Button>
			</DialogFooter>
		</DialogContent>
	</Dialog>
</template>
