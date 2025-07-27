<script setup lang="ts">
const props = defineProps<{ class?: string }>()

const filtersStore = useFiltersStore()
const scheduleStore = useScheduleStore()

const isOpen = ref(false)

const lessonTypes = [
	{ id: "Лк", name: "Лекція" },
	{ id: "Пз", name: "Практичне заняття" },
	{ id: "Лб", name: "Лабораторна робота" },
	{ id: "Конс", name: "Консультація" },
	{ id: "Зал", name: "Залік" },
	{ id: "Екз", name: "Екзамен" },
]

const selectedSchedule = computed(() => scheduleStore.selectedSchedule)

watch(isOpen, (open) => {
	if (open && selectedSchedule.value) {
		filtersStore.loadFilters(selectedSchedule.value.id, selectedSchedule.value.type)
	}
})
</script>

<template>
	<Dialog v-model:open="isOpen">
		<DialogTrigger as-child>
			<Button size="icon" :class="props.class">
				<Icon name="lucide:filter" class="!size-4" />
			</Button>
		</DialogTrigger>

		<DialogContent class="max-w-md">
			<DialogHeader>
				<DialogTitle class="flex items-center gap-2">
					<Icon name="lucide:filter" class="!size-5" />
					Фільтри
				</DialogTitle>
				<DialogDescription> Налаштуйте фільтри для відображення розкладу. </DialogDescription>
			</DialogHeader>

			<div
				v-if="!selectedSchedule"
				class="text-muted-foreground flex items-center justify-center py-8"
			>
				Оберіть розклад для налаштування фільтрів
			</div>

			<div v-else class="space-y-4">
				<div class="space-y-3">
					<h3 class="text-sm font-medium">Типи занять</h3>
					<div class="space-y-2">
						<div
							v-for="lessonType in lessonTypes"
							:key="lessonType.id"
							class="flex items-center space-x-2"
						>
							<input
								:id="`lesson-${lessonType.id}`"
								type="checkbox"
								:checked="filtersStore.isActive(lessonType.id)"
								@change="
									() => {
										filtersStore.toggleFilter(lessonType.id)
									}
								"
								class="size-4 rounded border-gray-300"
							/>
							<label :for="`lesson-${lessonType.id}`" class="cursor-pointer text-sm font-medium">
								{{ lessonType.name }}
							</label>
						</div>
					</div>
				</div>
			</div>

			<DialogFooter v-if="selectedSchedule" class="flex gap-2">
				<Button variant="outline" @click="filtersStore.clearAll">
					<Icon name="lucide:rotate-ccw" class="mr-2 !size-4" />
					Скинути
				</Button>
				<DialogClose as-child>
					<Button>
						<Icon name="lucide:check" class="mr-2 !size-4" />
						Закрити
					</Button>
				</DialogClose>
			</DialogFooter>
		</DialogContent>
	</Dialog>
</template>
