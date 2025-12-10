<script setup lang="ts">
import { computed, ref } from "vue"
import { useSharableLinks } from "../composables/useSharableLinks"

interface Props {
	modelValue: boolean
	selectedLinkIds: string[]
}

interface Emits {
	"update:modelValue": [value: boolean]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const isOpen = computed({
	get: () => props.modelValue,
	set: (value) => emit("update:modelValue", value),
})

const { createSharableLink, isLoading } = useSharableLinks()
const sharableUrl = ref<string | null>(null)
const copied = ref(false)

const handleCreateLink = async () => {
	const url = await createSharableLink(props.selectedLinkIds)
	if (url) {
		sharableUrl.value = url
	}
}

const copyToClipboard = async () => {
	if (!sharableUrl.value) return
	try {
		await navigator.clipboard.writeText(sharableUrl.value)
		copied.value = true
		setTimeout(() => {
			copied.value = false
		}, 2000)
	} catch (error) {
		console.error("Failed to copy:", error)
	}
}

const handleClose = () => {
	sharableUrl.value = null
	isOpen.value = false
}
</script>

<template>
	<Dialog v-model:open="isOpen">
		<DialogContent class="max-w-md">
			<DialogHeader>
				<DialogTitle>Поділіться посиланнями</DialogTitle>
			</DialogHeader>

			<div v-if="!sharableUrl" class="space-y-4">
				<p class="text-muted-foreground text-sm">
					Буде створено посилання для {{ selectedLinkIds.length }}
					{{ selectedLinkIds.length === 1 ? "посилання" : "посилань" }}
				</p>
				<Button
					class="w-full"
					:disabled="isLoading || selectedLinkIds.length === 0"
					@click="handleCreateLink"
				>
					<AppIcon name="lucide:share-2" class="mr-2" />
					Створити посилання для поділу
				</Button>
			</div>

			<div v-else class="space-y-4">
				<div class="bg-muted space-y-2 rounded-lg p-3">
					<p class="text-muted-foreground text-xs">Ваше посилання:</p>
					<div class="flex items-center gap-2">
						<code class="bg-background flex-1 rounded p-2 text-xs break-all">
							{{ sharableUrl }}
						</code>
						<Button
							size="icon"
							variant="outline"
							:class="{ 'bg-green-100': copied }"
							@click="copyToClipboard"
						>
							<AppIcon :name="copied ? 'lucide:check' : 'lucide:copy'" class="h-4 w-4" />
						</Button>
					</div>
				</div>

				<p class="text-muted-foreground text-xs">
					Відправте це посилання тій особі, яка хоче імпортувати ваші посилання
				</p>

				<Button variant="outline" class="w-full" @click="handleClose"> Готово </Button>
			</div>
		</DialogContent>
	</Dialog>
</template>
