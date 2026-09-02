<script setup lang="ts">
import type { TableSizeEntry } from "~/queries/dash"

const props = defineProps<{
	tableSizes: TableSizeEntry[]
	isPending: boolean
}>()

// Sort by size descending
const sorted = computed(() => [...props.tableSizes].sort((a, b) => b.sizeBytes - a.sizeBytes))

const maxBytes = computed(() => sorted.value[0]?.sizeBytes ?? 1)
</script>

<template>
	<div class="space-y-3 pt-2">
		<template v-if="isPending">
			<div class="space-y-2">
				<UiSkeleton v-for="i in 5" :key="i" class="h-10 w-full rounded" />
			</div>
		</template>

		<template v-else-if="!tableSizes.length">
			<AppEmptyState
				icon="ph:database"
				title="Немає даних"
				description="Інформація про розміри таблиць недоступна."
				variant="card"
			/>
		</template>

		<template v-else>
			<div class="overflow-x-auto rounded-lg border">
				<table class="w-full text-sm">
					<thead>
						<tr class="bg-muted/40 border-b">
							<th
								class="text-muted-foreground px-4 py-2.5 text-left text-xs
									font-medium"
							>
								Таблиця
							</th>
							<th
								class="text-muted-foreground px-4 py-2.5 text-right text-xs
									font-medium"
							>
								Рядків
							</th>
							<th
								class="text-muted-foreground px-4 py-2.5 text-right text-xs
									font-medium"
							>
								Розмір
							</th>
							<th class="text-muted-foreground w-32 px-4 py-2.5 text-xs font-medium">
								<!-- bar column -->
							</th>
						</tr>
					</thead>
					<tbody class="divide-y">
						<tr
							v-for="t in sorted"
							:key="t.tableName"
							class="hover:bg-muted/20 transition-colors"
						>
							<td class="px-4 py-2.5 font-mono text-xs">{{ t.tableName }}</td>
							<td class="px-4 py-2.5 text-right font-mono text-xs">
								{{ t.rowCount.toLocaleString("uk-UA") }}
							</td>
							<td class="px-4 py-2.5 text-right font-mono text-xs font-medium">
								{{ t.sizePretty }}
							</td>
							<td class="px-4 py-2.5">
								<div class="bg-muted h-1.5 overflow-hidden rounded-full">
									<div
										class="bg-primary/50 h-full rounded-full transition-[width]"
										:style="{ width: `${(t.sizeBytes / maxBytes) * 100}%` }"
									/>
								</div>
							</td>
						</tr>
					</tbody>
				</table>
			</div>
		</template>
	</div>
</template>
