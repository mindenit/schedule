<script setup lang="ts">
import type { Schedule, Subject } from "nurekit"
import { useLinksStore, type Link } from "~/core/stores/links"

interface Props {
	event: Schedule
}

const props = defineProps<Props>()

const { formatTimeRange, formatDate, getEventTypeColor, getEventTypeLabel } = useEventFormatting()
const linksStore = useLinksStore()

const eventLinks = computed(() => linksStore.getLinks(props.event.subject.id, props.event.type))

const eventTypeLabel = computed(() => getEventTypeLabel(props.event.type))
const eventTypeColor = computed(() => getEventTypeColor(props.event.type))
const formattedTimeRange = computed(() => formatTimeRange(props.event))
const formattedDate = computed(() => formatDate(props.event.startedAt))

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
	}
}

const deleteLink = (linkId: string) => {
	linksStore.deleteLink(props.event.subject.id, props.event.type, linkId)
}
</script>

<template>
	<div class="space-y-4">
		<div class="flex items-start gap-3">
			<div class="mt-1.5 h-3 w-3 flex-shrink-0 rounded-full" :class="eventTypeColor" />
			<div class="min-w-0 flex-1">
				<h3 class="text-base leading-tight font-semibold">
					{{ `(${event.subject.brief}) ${event.subject.title}` }}
				</h3>
				<div class="mt-1 flex items-center gap-2">
					<p class="text-muted-foreground text-sm">
						{{ eventTypeLabel }}
					</p>
				</div>
			</div>
		</div>

		<div class="flex items-center gap-3 text-sm">
			<AppIcon name="lucide:clock" class="text-muted-foreground flex-shrink-0" />
			<div class="flex flex-col gap-1">
				<span>{{ formattedTimeRange }}</span>
				<span class="text-muted-foreground text-xs">{{ pairNumber }}</span>
			</div>
		</div>

		<div class="flex items-center gap-3 text-sm">
			<AppIcon name="lucide:calendar" class="text-muted-foreground flex-shrink-0" />
			<span>{{ formattedDate }}</span>
		</div>

		<div class="flex items-center gap-3 text-sm">
			<AppIcon name="lucide:map-pin" class="text-muted-foreground flex-shrink-0" />
			<div class="flex flex-col gap-1">
				<span class="font-medium">{{ auditoriumText }}</span>
				<span class="text-muted-foreground text-xs">Аудиторія</span>
			</div>
		</div>

		<div class="flex items-center gap-3 text-sm">
			<AppIcon name="lucide:user" class="text-muted-foreground mt-0.5 flex-shrink-0" />
			<div class="flex flex-col gap-1">
				<span>{{ teachersText }}</span>
				<span class="text-muted-foreground text-xs">
					{{ event.teachers.length === 1 ? "Викладач" : "Викладачі" }}
				</span>
			</div>
		</div>

		<div class="flex items-center gap-3 text-sm">
			<AppIcon name="lucide:users" class="text-muted-foreground mt-0.5 flex-shrink-0" />
			<div class="flex flex-col gap-1">
				<span>{{ groupsText }}</span>
				<span class="text-muted-foreground text-xs">
					{{ event.groups.length === 1 ? "Група" : "Групи" }}
				</span>
			</div>
		</div>

		<div class="space-y-2">
			<div class="flex items-center justify-between">
				<h4 class="text-sm font-medium">Посилання</h4>
				<Button size="icon" variant="outline" @click="addLink">
					<AppIcon name="lucide:plus" />
				</Button>
			</div>
			<div v-if="eventLinks.length" class="space-y-2">
				<div
					v-for="link in eventLinks"
					:key="link.id"
					class="flex items-center justify-between gap-2"
				>
					<a :href="link.url" target="_blank" class="text-primary truncate hover:underline">
						{{ link.name }}
					</a>
					<div class="flex gap-1">
						<Button size="icon" variant="ghost" @click="editLink(link)">
							<AppIcon name="lucide:pencil" />
						</Button>
						<Button size="icon" variant="ghost" @click="deleteLink(link.id)">
							<AppIcon name="lucide:trash" />
						</Button>
					</div>
				</div>
			</div>
			<p v-else class="text-muted-foreground py-2 text-center text-xs">
				Немає збережених посилань для цього заняття.
			</p>
		</div>

		<LinkDialog v-model="showLinkDialog" :link="editingLink" @save="saveLink" />
	</div>
</template>
