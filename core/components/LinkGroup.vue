<script setup lang="ts">
import type { Subject } from "nurekit"
import type { Link } from "~/core/stores/links"

interface Props {
	subject: Subject
	eventType: string
	links: Link[]
}

defineProps<Props>()

const emit = defineEmits<{
	addLink: []
	editLink: [link: Link]
	deleteLink: [linkId: string]
}>()
</script>

<template>
	<div class="rounded-lg border p-4">
		<div class="mb-3 flex items-center justify-between">
			<div>
				<h4 class="font-medium">
					{{ subject.brief ? `(${subject.brief}) ${subject.title}` : subject.title }}
				</h4>
				<p class="text-muted-foreground text-sm">{{ eventType }}</p>
			</div>
			<Button size="sm" variant="outline" @click="emit('addLink')">
				<Icon name="lucide:plus" class="h-4 w-4" />
				Додати
			</Button>
		</div>

		<div class="space-y-2">
			<LinkItem
				v-for="link in links"
				:key="link.id"
				:link="link"
				@edit="emit('editLink', link)"
				@delete="emit('deleteLink', link.id)"
			/>
		</div>
	</div>
</template>
