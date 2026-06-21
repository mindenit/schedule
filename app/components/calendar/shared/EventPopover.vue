<script setup lang="ts">
import type { Schedule, Subject } from "nurekit"
import { useLinksStore, type Link } from "~/stores/links"

interface Props {
	event: Schedule
}

const props = defineProps<Props>()

const { formatTimeRange, formatDate, getEventTypeColor, getEventTypeLabel } = useEventFormatting()
const linksStore = useLinksStore()
const { trackEvent } = useAnalytics()

const eventLinks = computed(() => linksStore.getLinks(props.event.subject.id, props.event.type))

const eventTypeLabel = computed(() => getEventTypeLabel(props.event.type))
const eventTypeColor = computed(() => getEventTypeColor(props.event.type))
const formattedTimeRange = computed(() => formatTimeRange(props.event))
const formattedDate = computed(() => formatDate(props.event.startedAt))

const pairIndexText = computed(() => {
	return `Пара ${props.event.pairIndex} з ${props.event.pairsCount}`
})

const teachersText = computed(() => {
	if (!props.event.teachers || props.event.teachers.length === 0) return "Не вказані"
	return props.event.teachers.map((teacher) => teacher.shortName).join(", ")
})

const groupsText = computed(() => {
	if (!props.event.groups || props.event.groups.length === 0) return "Не вказані"
	return props.event.groups.map((group) => group.name).join(", ")
})

const auditoriumText = computed(() => {
	return props.event.auditorium?.name || "Не вказана"
})

const pairNumber = computed(() => {
	return `${props.event.numberPair} пара`
})

const showLinkDialog = ref(false)
const editingLink = ref<Link | null>(null)

const addLink = () => {
	editingLink.value = null
	showLinkDialog.value = true
}

const editLink = (link: Link) => {
	editingLink.value = link
	showLinkDialog.value = true
}

const saveLink = (linkData: Partial<Link>) => {
	const subjectInfo: Subject = {
		id: props.event.subject.id,
		title: props.event.subject.title,
		brief: props.event.subject.brief,
	}

	if (editingLink.value) {
		linksStore.updateLink(props.event.subject.id, props.event.type, {
			...editingLink.value,
			...linkData,
		})
		trackEvent("link_edited")
	} else {
		linksStore.addLink(
			props.event.subject.id,
			props.event.type,
			{
				url: linkData.url || "",
				name: linkData.name || "",
			},
			subjectInfo
		)
		trackEvent("link_added")
	}
}

const deleteLink = (linkId: string) => {
	linksStore.deleteLink(props.event.subject.id, props.event.type, linkId)
	trackEvent("link_deleted")
}
</script>

<template>
	<div class="space-y-3">
		<div class="flex items-start gap-2.5">
			<div class="mt-1 h-3 w-3 flex-shrink-0 rounded-full shadow-sm" :class="eventTypeColor" />
			<div class="min-w-0 flex-1">
				<h3 class="text-sm leading-tight font-semibold tracking-tight">
					{{ event.subject.title }}
				</h3>
				<div class="mt-1 flex items-center gap-1.5">
					<span class="text-muted-foreground text-xs font-medium">{{ event.subject.brief }}</span>
					<span class="text-muted-foreground">·</span>
					<span class="text-muted-foreground text-xs">{{ eventTypeLabel }}</span>
				</div>
			</div>
		</div>

		<div class="bg-muted/50 space-y-1.5 rounded-lg p-2.5 text-xs">
			<div class="flex items-center gap-2">
				<AppIcon name="lucide:clock" size="3.5" class="text-muted-foreground flex-shrink-0" />
				<span class="font-medium">{{ formattedTimeRange }}</span>
				<span class="text-muted-foreground">·</span>
				<span class="text-muted-foreground">{{ pairNumber }}</span>
			</div>

			<div class="flex items-center gap-2">
				<AppIcon name="lucide:calendar" size="3.5" class="text-muted-foreground flex-shrink-0" />
				<span>{{ formattedDate }}</span>
				<span class="text-muted-foreground">·</span>
				<span class="text-muted-foreground">{{ pairIndexText }}</span>
			</div>
		</div>

		<div class="space-y-2 text-xs">
			<div class="grid grid-cols-2 gap-3">
				<div class="flex items-start gap-2">
					<AppIcon
						name="lucide:map-pin"
						size="3.5"
						class="text-muted-foreground mt-0.5 flex-shrink-0"
					/>
					<div class="min-w-0 flex-1">
						<div class="truncate font-medium">{{ auditoriumText }}</div>
						<div class="text-muted-foreground text-[11px]">Аудиторія</div>
					</div>
				</div>

				<div class="flex items-start gap-2">
					<AppIcon
						name="lucide:user"
						size="3.5"
						class="text-muted-foreground mt-0.5 flex-shrink-0"
					/>
					<div class="min-w-0 flex-1">
						<div class="truncate">{{ teachersText }}</div>
						<div class="text-muted-foreground text-[11px]">
							{{ event.teachers.length === 1 ? "Викладач" : "Викладачі" }}
						</div>
					</div>
				</div>
			</div>

			<div class="flex items-start gap-2">
				<AppIcon
					name="lucide:users"
					size="3.5"
					class="text-muted-foreground mt-0.5 flex-shrink-0"
				/>
				<div class="flex-1">
					<div>{{ groupsText }}</div>
					<div class="text-muted-foreground text-[11px]">
						{{ event.groups.length === 1 ? "Група" : "Групи" }}
					</div>
				</div>
			</div>
		</div>

		<!-- Links Section -->
		<div class="border-t pt-3">
			<div class="mb-2 flex items-center justify-between">
				<h4 class="flex items-center gap-1.5 text-xs font-semibold">
					<AppIcon name="lucide:link" size="3.5" />
					Посилання
				</h4>
				<UiButton size="icon" variant="ghost" class="size-7" aria-label="Додати посилання" @click="addLink">
					<AppIcon name="lucide:plus" size="3.5" />
				</UiButton>
			</div>
			<div v-if="eventLinks.length" class="max-h-[140px] space-y-1 overflow-auto">
				<div
					v-for="link in eventLinks"
					:key="link.id"
					class="bg-muted/30 hover:bg-muted/50 group flex items-center justify-between gap-2
						rounded-md px-2 py-1.5 transition-colors"
				>
					<a
						:href="link.url"
						target="_blank"
						class="text-primary truncate text-xs font-medium hover:underline"
						@click="trackEvent('link_opened')"
					>
						{{ link.name }}
					</a>
					<div class="flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
						<UiButton size="icon" variant="ghost" class="size-7" aria-label="Редагувати посилання" @click="editLink(link)">
							<AppIcon name="lucide:pencil" size="xs" />
						</UiButton>
						<UiButton
							size="icon"
							variant="ghost"
							class="text-destructive size-7"
							aria-label="Видалити посилання"
							@click="deleteLink(link.id)"
						>
							<AppIcon name="lucide:trash" size="xs" />
						</UiButton>
					</div>
				</div>
			</div>
			<AppEmptyState v-else title="Немає збережених посилань" />
		</div>

		<LinksAddDialog v-model="showLinkDialog" :link="editingLink" @save="saveLink" />
	</div>
</template>
