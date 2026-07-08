<script setup lang="ts">
import { useLinksStore, type Link } from "~/stores/links"
import ShareLinksDialog from "~/components/links/ShareLinksDialog.vue"
import type { Subject } from "nurekit"
import { SHARE_LINKS } from "~/constants/features"

const linksStore = useLinksStore()
const { trackEvent } = useAnalytics()
const { saveLink: saveLinkCrud, deleteLink: deleteLinkCrud } = useLinkCrud()

const showLinkDialog = ref(false)
const showShareDialog = ref(false)
const editingLink = ref<Link | null>(null)
const editingContext = ref<{ subjectId: string; eventType: string; subject: Subject } | null>(null)
const selectedLinkIds = ref<string[]>([])

const treeView = ref<{
	selectAll: () => void
	clearSelection: () => void
	allSelected: boolean
	isEmpty: boolean
} | null>(null)

const totalLinkCount = computed(() =>
	Object.values(linksStore.links).reduce(
		(sum, s) => sum + Object.values(s.events).reduce((s2, arr) => s2 + arr.length, 0),
		0
	)
)

const hasLinks = computed(() => !treeView.value?.isEmpty)
const allSelected = computed(() => treeView.value?.allSelected ?? false)

const toggleSelectAll = () => {
	if (allSelected.value) {
		treeView.value?.clearSelection()
	} else {
		treeView.value?.selectAll()
	}
}

const editLink = (link: Link, subjectId: string, eventType: string, subject: Subject) => {
	editingLink.value = link
	editingContext.value = { subjectId, eventType, subject }
	showLinkDialog.value = true
}

const saveLink = (linkData: Partial<Link>) => {
	if (!editingContext.value) return
	const { subjectId, eventType, subject } = editingContext.value
	saveLinkCrud(parseInt(subjectId), eventType, linkData, subject, editingLink.value)
}

const deleteLink = (linkId: string, subjectId: string, eventType: string) => {
	deleteLinkCrud(parseInt(subjectId), eventType, linkId)
}

const handleImportLinks = (file: File) => {
	const reader = new FileReader()
	reader.onload = (e) => {
		const raw = e.target?.result as string
		try {
			const countBefore = totalLinkCount.value
			const result = linksStore.importLinks(raw)
			if (!result.success) {
				useSonner.error("Помилка імпорту", {
					description: result.error || "Не вдалося імпортувати посилання",
				})
			} else {
				// Diff against pre-import count — works for both array and object backup formats.
				const count = totalLinkCount.value - countBefore
				trackEvent("links_imported", { count })
				useSonner.success("Імпорт завершено", {
					description: "Посилання успішно імпортовані",
				})
			}
		} catch {
			useSonner.error("Помилка імпорту", {
				description: "Файл має неправильний формат",
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
	<div class="flex flex-col gap-3">
		<div class="flex flex-wrap items-center justify-end gap-2">
			<UiButton v-if="hasLinks" size="sm" variant="outline" @click="toggleSelectAll">
				{{ allSelected ? "Скасувати вибір" : "Вибрати все" }}
			</UiButton>
			<UiButton
				v-if="SHARE_LINKS && selectedLinkIds.length > 0"
				size="sm"
				variant="outline"
				@click="showShareDialog = true"
			>
				<AppIcon name="lucide:share-2" />
				Поділитися ({{ selectedLinkIds.length }})
			</UiButton>
			<UiButton
				v-if="hasLinks"
				size="sm"
				variant="outline"
				@click="
					() => {
						if (selectedLinkIds.length > 0) {
							linksStore.exportSelectedLinks(selectedLinkIds)
							trackEvent('links_exported', {
								scope: 'selected',
								count: selectedLinkIds.length,
							})
						} else {
							linksStore.exportLinks()
							trackEvent('links_exported', { scope: 'all', count: totalLinkCount })
						}
					}
				"
			>
				<AppIcon name="lucide:download" />
				{{
					selectedLinkIds.length > 0
						? `Експортувати (${selectedLinkIds.length})`
						: "Експортувати все"
				}}
			</UiButton>
			<UiButton size="sm" variant="outline" @click="triggerImport">
				<AppIcon name="lucide:upload" />
				Імпортувати
			</UiButton>
		</div>

		<div>
			<LinksTreeView
				ref="treeView"
				:on-edit-link="editLink"
				:on-delete-link="deleteLink"
				@selection-change="(ids) => (selectedLinkIds = ids)"
			/>
		</div>

		<LinksAddDialog v-model="showLinkDialog" :link="editingLink" @save="saveLink" />

		<ShareLinksDialog
			v-if="SHARE_LINKS"
			v-model="showShareDialog"
			:selected-link-ids="selectedLinkIds"
		/>

		<input
			ref="fileInput"
			type="file"
			accept=".json"
			class="hidden"
			@change="handleMainImport"
		/>
	</div>
</template>
