<script setup lang="ts">
import { toast } from "vue-sonner"
import { useLinksStore, type Link } from "~/stores/links"
import ShareLinksDialog from "~/components/links/ShareLinksDialog.vue"
import type { Subject } from "nurekit"

const linksStore = useLinksStore()

const showLinkDialog = ref(false)
const showShareDialog = ref(false)
const editingLink = ref<Link | null>(null)
const editingContext = ref<{ subjectId: string; eventType: string; subject: Subject } | null>(null)
const selectedLinkIds = ref<string[]>([])

const treeView = ref<{ selectAll: () => void; clearSelection: () => void; allSelected: boolean; isEmpty: boolean } | null>(null)

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

const handleImportLinks = (file: File) => {
	const reader = new FileReader()
	reader.onload = (e) => {
		try {
			const result = linksStore.importLinks(e.target?.result as string)
			if (!result.success) {
				toast.error("Помилка імпорту", {
					description: result.error || "Не вдалося імпортувати посилання",
				})
			} else {
				toast.success("Імпорт завершено", {
					description: "Посилання успішно імпортовані",
				})
			}
		} catch {
			toast.error("Помилка імпорту", {
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
			<UiButton
				v-if="hasLinks"
				size="sm"
				variant="ghost"
				@click="toggleSelectAll"
			>
				{{ allSelected ? 'Скасувати вибір' : 'Вибрати все' }}
			</UiButton>
			<UiButton
				v-if="selectedLinkIds.length > 0"
				size="sm"
				variant="outline"
				@click="showShareDialog = true"
			>
				<AppIcon name="lucide:share-2" />
				Поділитися ({{ selectedLinkIds.length }})
			</UiButton>
			<UiButton
				v-if="selectedLinkIds.length > 0"
				size="sm"
				variant="outline"
				@click="linksStore.exportSelectedLinks(selectedLinkIds)"
			>
				<AppIcon name="lucide:download" />
				Експорт вибраного
			</UiButton>
			<UiButton
				v-if="hasLinks"
				size="sm"
				variant="outline"
				@click="linksStore.exportLinks()"
			>
				<AppIcon name="lucide:download" />
				Експортувати
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

		<ShareLinksDialog v-model="showShareDialog" :selected-link-ids="selectedLinkIds" />

		<input ref="fileInput" type="file" accept=".json" class="hidden" @change="handleMainImport" />
	</div>
</template>
