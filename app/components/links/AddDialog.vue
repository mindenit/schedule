<script setup lang="ts">
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
	<UiDialog v-model:open="isOpen">
		<UiDialogContent>
			<UiDialogHeader>
				<UiDialogTitle>{{ link ? "Редагувати" : "Додати" }} посилання</UiDialogTitle>
				<UiDialogDescription>
					Вставте посилання та, за бажанням, вкажіть його назву.
				</UiDialogDescription>
			</UiDialogHeader>
			<div class="grid gap-4">
				<div class="grid w-full items-center gap-1.5">
					<UiLabel for="url">URL</UiLabel>
					<UiInput id="url" v-model="internalLink.url" placeholder="https://..." />
				</div>
				<div class="grid w-full items-center gap-1.5">
					<UiLabel for="name">Назва</UiLabel>
					<UiInput id="name" v-model="internalLink.name" placeholder="(необов'язково)" />
				</div>
			</div>
			<UiDialogFooter>
				<UiButton type="submit" @click="save">Зберегти</UiButton>
			</UiDialogFooter>
		</UiDialogContent>
	</UiDialog>
</template>
