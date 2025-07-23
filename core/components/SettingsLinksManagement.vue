<script setup lang="ts">
import { toast } from "vue-sonner"
import { useLinksStore, type Link } from "~/core/stores/links"
import type { Subject } from "nurekit"

const emit = defineEmits<{
	back: []
}>()

const linksStore = useLinksStore()

const showLinkDialog = ref(false)
const editingLink = ref<Link | null>(null)
const editingContext = ref<{ subjectId: string; eventType: string; subject: Subject } | null>(null)

const organizedLinks = computed(() => {
	const result: Array<{
		subjectId: string
		subject: Subject
		eventType: string
		links: Link[]
	}> = []

	Object.entries(linksStore.links).forEach(([subjectId, subjectData]) => {
		const subject = subjectData.subject
		Object.entries(subjectData.events).forEach(([eventType, links]) => {
			if (links.length > 0) {
				result.push({
					subjectId,
					subject,
					eventType,
					links,
				})
			}
		})
	})

	return result
})

const addLink = (subjectId: string, eventType: string, subject: Subject) => {
	editingLink.value = null
	editingContext.value = { subjectId, eventType, subject }
	showLinkDialog.value = true
}

const editLink = (link: Link, subjectId: string, eventType: string, subject: Subject) => {
	editingLink.value = link
	editingContext.value = { subjectId, eventType, subject }
	showLinkDialog.value = true
}

const saveLink = (linkData: Partial<Link>) => {
	if (!editingContext.value) return

	const { subjectId, eventType, subject } = editingContext.value

	if (editingLink.value) {
		linksStore.updateLink(parseInt(subjectId), eventType, {
			...editingLink.value,
			...linkData,
		})
		toast.success("Посилання оновлено", {
			description: "Зміни успішно збережено",
		})
	} else {
		linksStore.addLink(
			parseInt(subjectId),
			eventType,
			{
				url: linkData.url || "",
				name: linkData.name || "",
			},
			subject
		)
		toast.success("Посилання додано", {
			description: "Нове посилання успішно створено",
		})
	}
}

const deleteLink = (linkId: string, subjectId: string, eventType: string) => {
	linksStore.deleteLink(parseInt(subjectId), eventType, linkId)
	toast.success("Посилання видалено", {
		description: "Посилання успішно видалено",
	})
}
</script>

<template>
	<div class="flex flex-col overflow-hidden py-4">
		<div class="mb-4 flex items-center justify-between">
			<h3 class="text-lg font-medium">Управління посиланнями</h3>
		</div>

		<div class="flex-1 overflow-y-auto">
			<div v-if="organizedLinks.length === 0" class="py-8 text-center text-gray-500">
				<Icon name="lucide:link-off" class="mx-auto mb-2 h-8 w-8" />
				<p>Немає збережених посилань</p>
				<p class="mt-1 text-xs">Додайте посилання до занять через календар</p>
			</div>

			<div v-else class="space-y-6">
				<LinkGroup
					v-for="group in organizedLinks"
					:key="`${group.subjectId}-${group.eventType}`"
					:subject="group.subject"
					:event-type="group.eventType"
					:links="group.links"
					@add-link="addLink(group.subjectId, group.eventType, group.subject)"
					@edit-link="(link) => editLink(link, group.subjectId, group.eventType, group.subject)"
					@delete-link="(linkId) => deleteLink(linkId, group.subjectId, group.eventType)"
				/>
			</div>
		</div>

		<div class="flex justify-start border-t pt-4">
			<Button variant="outline" @click="emit('back')">
				<Icon name="lucide:arrow-left" />
				Назад
			</Button>
		</div>

		<LinkDialog v-model="showLinkDialog" :link="editingLink" @save="saveLink" />
	</div>
</template>
