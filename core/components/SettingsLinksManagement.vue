<script setup lang="ts">
import { toast } from "vue-sonner"
import { useLinksStore, type Link } from "~/core/stores/links"
import type { Subject } from "nurekit"

const { t } = useI18n()
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
		toast.success(t("settings.link_updated"), {
			description: t("settings.link_updated_description"),
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
		toast.success(t("settings.link_added"), {
			description: t("settings.link_added_description"),
		})
	}
}

const deleteLink = (linkId: string, subjectId: string, eventType: string) => {
	linksStore.deleteLink(parseInt(subjectId), eventType, linkId)
	toast.success(t("settings.link_deleted"), {
		description: t("settings.link_deleted_description"),
	})
}

const handleImportLinks = (file: File) => {
	const reader = new FileReader()
	reader.onload = (e) => {
		try {
			const result = linksStore.importLinks(e.target?.result as string)
			if (!result.success) {
				toast.error(t("settings.import_error"), {
					description: result.error || t("settings.import_error_description"),
				})
			} else {
				toast.success(t("settings.import_completed"), {
					description: t("settings.import_completed_description"),
				})
			}
		} catch {
			toast.error(t("settings.import_error"), {
				description: t("settings.incorrect_format"),
			})
		}
	}
	reader.readAsText(file)
}

const fileInput = ref<HTMLInputElement | null>(null)

const triggerImport = () => {
	fileInput.value?.click()
}

const handleMainImport = (event: Event) => {
	const target = event.target as HTMLInputElement
	const file = target.files?.[0]
	if (!file) return

	handleImportLinks(file)

	if (target) {
		target.value = ""
	}
}
</script>

<template>
	<div class="flex flex-col overflow-hidden">
		<div class="flex items-center justify-between max-md:flex-col max-md:gap-2 max-md:pb-2">
			<h3 class="text-lg font-medium">{{ t('settings.manage_links') }}</h3>
			<Button size="sm" @click="triggerImport">
				<AppIcon name="lucide:download" />
				{{ t('settings.import') }}
			</Button>
		</div>

		<div class="flex-1 overflow-hidden">
			<div v-if="organizedLinks.length === 0" class="py-8 text-center text-gray-500">
				<p>{{ t('settings.no_saved_links') }}</p>
				<p class="mt-1 text-xs">{{ t('settings.add_links_from_calendar') }}</p>
			</div>

			<div v-else class="h-full">
				<LinksDataTable
					:organized-links="organizedLinks"
					@edit-link="editLink"
					@delete-link="deleteLink"
					@import-links="handleImportLinks"
				/>
			</div>
		</div>

		<LinkDialog v-model="showLinkDialog" :link="editingLink" @save="saveLink" />

		<input ref="fileInput" type="file" accept=".json" class="hidden" @change="handleMainImport" />
	</div>
</template>
