<script setup lang="ts">
const props = defineProps<{ class?: string }>()
</script>

<template>
	<Dialog>
		<DialogTrigger as-child>
			<Button size="icon" :class="props.class">
				<Icon name="lucide:filter" class="!size-4" />
			</Button>
		</DialogTrigger>
		<DialogContent class="max-w-md">
			<DialogHeader>
				<DialogTitle class="flex items-center gap-2">
					<Icon name="lucide:filter" class="!size-5" />
					Фільтри
				</DialogTitle>
				<DialogDescription> Налаштуйте фільтри для відображення розкладу. </DialogDescription>
			</DialogHeader>
			Контент фільтрів буде тут.
		</DialogContent>
	</Dialog>
</template>
