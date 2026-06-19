<script setup lang="ts">
import { useLinksStore, type Link } from "~/stores/links"
import type { Subject } from "nurekit"

// ─── Props & emits ────────────────────────────────────────────────────────────

interface Props {
	/** Called when edit icon is clicked on a leaf link. */
	onEditLink?: (link: Link, subjectId: string, eventType: string, subject: Subject) => void
	/** Called when delete icon is clicked on a leaf link. */
	onDeleteLink?: (linkId: string, subjectId: string, eventType: string) => void
}

const props = defineProps<Props>()

const emit = defineEmits<{
	/** Emits the flat list of selected link IDs whenever selection changes. */
	selectionChange: [ids: string[]]
}>()

// ─── Tree node types ──────────────────────────────────────────────────────────

type SubjectNode = {
	kind: "subject"
	id: string
	label: string
	brief: string
	subject: Subject
	children: EventTypeNode[]
}

type EventTypeNode = {
	kind: "eventType"
	id: string
	label: string
	subjectId: string
	subject: Subject
	children: LinkNode[]
}

type LinkNode = {
	kind: "link"
	id: string
	name: string
	url: string
	subjectId: string
	eventType: string
	subject: Subject
}

type TreeNode = SubjectNode | EventTypeNode | LinkNode

// ─── Data ─────────────────────────────────────────────────────────────────────

const linksStore = useLinksStore()

const treeItems = computed<SubjectNode[]>(() => {
	return Object.entries(linksStore.links).map(([subjectId, subjectData]) => {
		const subject = subjectData.subject
		const children: EventTypeNode[] = Object.entries(subjectData.events)
			.filter(([, links]) => links.length > 0)
			.map(([eventType, links]) => ({
				kind: "eventType" as const,
				id: `${subjectId}__${eventType}`,
				label: eventType,
				subjectId,
				subject,
				children: links.map((link) => ({
					kind: "link" as const,
					id: link.id,
					name: link.name || link.url,
					url: link.url,
					subjectId,
					eventType,
					subject,
				})),
			}))

		return {
			kind: "subject" as const,
			id: subjectId,
			label: subject.title,
			brief: subject.brief,
			subject,
			children,
		}
	})
})

const isEmpty = computed(() => treeItems.value.length === 0)

// ─── Tree config ──────────────────────────────────────────────────────────────

const getKey = (node: TreeNode) => node.id

const getChildren = (node: TreeNode): TreeNode[] | undefined => {
	if (node.kind === "link") return undefined
	return node.children.length > 0 ? node.children : undefined
}

// All subject + eventType node IDs expanded by default
const defaultExpanded = computed(() =>
	treeItems.value.flatMap((s) => [s.id, ...s.children.map((e) => e.id)]),
)

// ─── Selection ────────────────────────────────────────────────────────────────

const selected = ref<TreeNode[]>([])

const allLinkCount = computed(() =>
	treeItems.value.reduce(
		(sum, s) => sum + s.children.reduce((s2, e) => s2 + e.children.length, 0),
		0,
	),
)

const selectedLinkCount = computed(
	() => selected.value.filter((n) => n.kind === "link").length,
)

const allSelected = computed(
	() => allLinkCount.value > 0 && selectedLinkCount.value === allLinkCount.value,
)

function selectAll() {
	// Select at subject level — propagateSelect cascades to all descendants
	selected.value = [...treeItems.value]
}

function clearSelection() {
	selected.value = []
}

watch(
	selected,
	(nodes) => {
		const linkIds = nodes.filter((n): n is LinkNode => n.kind === "link").map((n) => n.id)
		emit("selectionChange", linkIds)
	},
	{ deep: true },
)

defineExpose({ selectAll, clearSelection, allSelected, isEmpty })

// ─── Event type badge color ───────────────────────────────────────────────────

const EVENT_TYPE_TEXT: Record<string, string> = {
	Лб: "text-event-lab",
	Лк: "text-event-lecture",
	Пз: "text-event-practise",
	Зал: "text-event-credit",
	Екз: "text-event-exam",
	Конс: "text-event-consultation",
}

const EVENT_TYPE_BG: Record<string, string> = {
	Лб: "bg-event-lab/10",
	Лк: "bg-event-lecture/10",
	Пз: "bg-event-practise/10",
	Зал: "bg-event-credit/10",
	Екз: "bg-event-exam/10",
	Конс: "bg-event-consultation/10",
}
</script>

<template>
	<div v-if="isEmpty" class="text-muted-foreground py-8 text-center text-sm">
		<p>Немає збережених посилань</p>
		<p class="mt-1 text-xs">Додайте посилання до занять через календар</p>
	</div>

	<UiTree
		v-else
		v-model="selected"
		:items="treeItems"
		:get-key="getKey"
		:get-children="getChildren"
		:default-expanded="defaultExpanded"
		multiple
		propagate-select
		bubble-select
		class="w-full select-none"
	>
		<template #default="{ flattenItems }">
			<UiTreeItem
				v-for="item in flattenItems"
				:key="item._id"
				v-bind="item.bind"
				class="w-full"
				@select.prevent
				@toggle.prevent
			>
				<template #default="{ isSelected, isIndeterminate, handleSelect, handleToggle }">
					<!-- Subject row ─────────────────────────────────────────────── -->
					<template v-if="item.value.kind === 'subject'">
						<div class="hover:bg-muted/50 flex w-full items-center gap-2 rounded-md py-2 pl-2 pr-2 transition-colors">
							<!-- checkbox zone: select only -->
							<div class="shrink-0 cursor-pointer" @click.stop="handleSelect()">
								<UiCheckbox
									:model-value="isSelected || (isIndeterminate ? 'indeterminate' : false)"
									class="pointer-events-none"
								/>
							</div>
							<!-- label zone: expand / collapse -->
							<div class="min-w-0 flex-1 cursor-pointer" @click.stop="handleToggle()">
								<span class="text-sm font-semibold">{{ item.value.brief }}</span>
								<span class="text-muted-foreground ml-2 truncate text-xs">
									{{ item.value.label }}
								</span>
							</div>
						</div>
					</template>

					<!-- Event type row ───────────────────────────────────────────── -->
					<template v-else-if="item.value.kind === 'eventType'">
						<div class="hover:bg-muted/50 flex w-full items-center gap-2 rounded-md py-1.5 pl-6 pr-2 transition-colors">
							<!-- checkbox zone: select only -->
							<div class="shrink-0 cursor-pointer" @click.stop="handleSelect()">
								<UiCheckbox
									:model-value="isSelected || (isIndeterminate ? 'indeterminate' : false)"
									class="pointer-events-none"
								/>
							</div>
							<!-- label zone: expand / collapse -->
							<div class="cursor-pointer" @click.stop="handleToggle()">
								<span
									class="rounded px-1.5 py-0.5 text-xs font-medium"
									:class="[
										EVENT_TYPE_TEXT[item.value.label] ?? 'text-foreground',
										EVENT_TYPE_BG[item.value.label] ?? 'bg-muted',
									]"
								>
									{{ item.value.label }}
								</span>
							</div>
						</div>
					</template>

					<!-- Link leaf row ────────────────────────────────────────────── -->
					<template v-else-if="item.value.kind === 'link'">
						<div class="hover:bg-muted/50 flex w-full items-center gap-2 rounded-md py-1.5 pl-10 pr-2 transition-colors">
							<!-- checkbox + label zone: select only (leaves don't expand) -->
							<div class="shrink-0 cursor-pointer" @click.stop="handleSelect()">
								<UiCheckbox
									:model-value="isSelected"
									class="pointer-events-none"
								/>
							</div>
							<div class="min-w-0 flex-1 cursor-pointer" @click.stop="handleSelect()">
								<p class="truncate text-sm">{{ item.value.name }}</p>
								<a
									:href="item.value.url"
									target="_blank"
									rel="noopener noreferrer"
									class="text-muted-foreground hover:text-foreground truncate text-xs transition-colors"
									@click.stop
								>
									{{ item.value.url }}
								</a>
							</div>
							<div class="flex shrink-0 items-center gap-0.5">
								<UiButton
									v-if="props.onEditLink"
									size="icon-sm"
									variant="ghost"
									class="size-7"
									@click.stop="
										props.onEditLink?.(
											{ id: item.value.id, name: item.value.name, url: item.value.url },
											item.value.subjectId,
											item.value.eventType,
											item.value.subject,
										)
									"
								>
									<AppIcon name="lucide:pencil" />
								</UiButton>
								<UiButton
									v-if="props.onDeleteLink"
									size="icon-sm"
									variant="ghost"
									class="text-destructive hover:text-destructive size-7"
									@click.stop="
										props.onDeleteLink?.(
											item.value.id,
											item.value.subjectId,
											item.value.eventType,
										)
									"
								>
									<AppIcon name="lucide:trash" />
								</UiButton>
							</div>
						</div>
					</template>
				</template>
			</UiTreeItem>
		</template>
	</UiTree>
</template>
