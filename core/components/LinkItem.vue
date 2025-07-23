<script setup lang="ts">
import type { Link } from "~/core/stores/links"

interface Props {
	link: Link
}

defineProps<Props>()

const emit = defineEmits<{
	edit: []
	delete: []
}>()
</script>

<template>
	<div class="bg-muted/30 flex items-center justify-between gap-2 rounded border p-2">
		<div class="flex min-w-0 flex-1 items-center gap-2">
			<Icon name="lucide:link" class="text-muted-foreground h-4 w-4 flex-shrink-0" />
			<div class="min-w-0 flex-1">
				<a
					:href="link.url"
					target="_blank"
					class="text-primary block truncate font-medium hover:underline"
				>
					{{ link.name }}
				</a>
				<p class="text-muted-foreground truncate text-xs">{{ link.url }}</p>
			</div>
		</div>
		<div class="flex flex-shrink-0 gap-1">
			<Button size="icon" variant="ghost" @click="emit('edit')">
				<Icon name="lucide:pencil" class="h-4 w-4" />
			</Button>
			<Button size="icon" variant="ghost" @click="emit('delete')">
				<Icon name="lucide:trash" class="h-4 w-4" />
			</Button>
		</div>
	</div>
</template>
