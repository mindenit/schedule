<script setup lang="ts">
import type {
	ColumnDef,
	ColumnFiltersState,
	SortingState,
	VisibilityState,
} from "@tanstack/vue-table"
import {
	FlexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useVueTable,
} from "@tanstack/vue-table"
import { h, ref, computed, resolveComponent } from "vue"
import { toast } from "vue-sonner"

import { Button } from "@/core/components/ui/button"
import { Checkbox } from "@/core/components/ui/checkbox"
import { Input } from "@/core/components/ui/input"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/core/components/ui/dropdown-menu"
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/core/components/ui/table"
import { Badge } from "@/core/components/ui/badge"

import type { Link } from "~/core/stores/links"
import type { Subject } from "nurekit"
import { valueUpdater } from "./ui/table/utils"

interface LinkTableRow {
	id: string
	name: string
	url: string
	subject: Subject
	eventType: string
	subjectId: string
	originalLink: Link
}

interface Props {
	organizedLinks: Array<{
		subjectId: string
		subject: Subject
		eventType: string
		links: Link[]
	}>
}

const props = defineProps<Props>()

const emit = defineEmits<{
	editLink: [link: Link, subjectId: string, eventType: string, subject: Subject]
	deleteLink: [linkId: string, subjectId: string, eventType: string]
	importLinks: [file: File]
}>()

const tableData = computed<LinkTableRow[]>(() => {
	const result: LinkTableRow[] = []

	props.organizedLinks.forEach((group) => {
		group.links.forEach((link) => {
			result.push({
				id: link.id,
				name: link.name,
				url: link.url,
				subject: group.subject,
				eventType: group.eventType,
				subjectId: group.subjectId,
				originalLink: link,
			})
		})
	})

	return result
})

const createIcon = (name: string, className: string = "") => {
	const IconComponent = resolveComponent("Icon")
	return h(IconComponent, { name, class: className })
}

const deleteSelectedLinks = () => {
	const selectedRows = table.getFilteredSelectedRowModel().rows
	if (selectedRows.length === 0) {
		toast.warning("Не вибрано жодного посилання")
		return
	}

	if (confirm(`Ви впевнені, що хочете видалити ${selectedRows.length} посилань?`)) {
		selectedRows.forEach((row) => {
			const link = row.original
			emit("deleteLink", link.id, link.subjectId, link.eventType)
		})

		toast.success("Посилання видалено", {
			description: `Видалено ${selectedRows.length} посилань`,
		})
	}
}

const columns: ColumnDef<LinkTableRow>[] = [
	{
		id: "select",
		header: ({ table }) =>
			h(
				"div",
				{ class: "flex items-center justify-center" },
				h(Checkbox, {
					modelValue: table.getIsAllPageRowsSelected(),
					"onUpdate:modelValue": (value: boolean | "indeterminate") => {
						if (typeof value === "boolean") table.toggleAllPageRowsSelected(value)
					},
					ariaLabel: "Select all",
					class: "!translate-y-0",
				})
			),
		cell: ({ row }) =>
			h(
				"div",
				{ class: "flex items-center justify-center" },
				h(Checkbox, {
					modelValue: row.getIsSelected(),
					"onUpdate:modelValue": (value: boolean | "indeterminate") => {
						if (typeof value === "boolean") {
							row.toggleSelected(!!value)
						}
					},
					ariaLabel: "Select row",
					class: "!translate-y-0",
				})
			),
		enableSorting: false,
		enableHiding: false,
	},
	{
		accessorKey: "name",
		header: ({ column }) => {
			return h(
				Button,
				{
					variant: "ghost",
					onClick: () => column.toggleSorting(column.getIsSorted() === "asc"),
				},
				() => ["Назва", createIcon("lucide:arrow-up-down", "!size-4")]
			)
		},
		cell: ({ row }) => {
			const name = row.getValue("name") as string
			const url = row.original.url
			return h("div", { class: "flex items-center gap-2" }, [
				h(
					"a",
					{
						href: url,
						target: "_blank",
						rel: "noopener noreferrer",
						class: "font-medium text-primary hover:underline flex items-center gap-1",
					},
					[name, createIcon("lucide:external-link", "!size-3")]
				),
			])
		},
	},
	{
		accessorKey: "subject.brief",
		header: ({ column }) => {
			return h(
				Button,
				{
					variant: "ghost",
					onClick: () => column.toggleSorting(column.getIsSorted() === "asc"),
				},
				() => ["Предмет", createIcon("lucide:arrow-up-down", "!size-4")]
			)
		},
		cell: ({ row }) => {
			const subject = row.original.subject
			return h("div", { class: "flex flex-col" }, [
				h("span", { class: "font-medium" }, subject.brief),
				h("span", { class: "text-xs text-muted-foreground" }, subject.title),
			])
		},
	},
	{
		accessorKey: "eventType",
		header: "Тип заняття",
		cell: ({ row }) => {
			const eventType = row.getValue("eventType") as string

			const getEventTypeColor = (type: string) => {
				return EVENT_TYPE_COLORS[type as TEventType]
					? `${EVENT_TYPE_COLORS[type as TEventType]} text-white`
					: "bg-gray-100 dark:bg-gray-700"
			}

			return h(
				Badge,
				{
					class: getEventTypeColor(eventType),
				},
				() => eventType.toUpperCase()
			)
		},
	},
	{
		accessorKey: "url",
		header: "URL",
		cell: ({ row }) => {
			const url = row.getValue("url") as string
			const displayUrl = url.length > 50 ? url.substring(0, 50) + "..." : url
			return h(
				"span",
				{
					class: "text-xs text-muted-foreground font-mono",
					title: url,
				},
				displayUrl
			)
		},
	},
	{
		id: "actions",
		enableHiding: false,
		cell: ({ row }) => {
			const link = row.original

			return h(
				"div",
				{ class: "relative" },
				h(
					DropdownMenu,
					{},
					{
						default: () => [
							h(
								DropdownMenuTrigger,
								{ asChild: true },
								{
									default: () =>
										h(
											Button,
											{
												variant: "ghost",
												class: "!size-8 p-0",
											},
											{
												default: () => [
													h("span", { class: "sr-only" }, "Open menu"),
													createIcon("lucide:menu", "!size-4"),
												],
											}
										),
								}
							),
							h(
								DropdownMenuContent,
								{ align: "end" },
								{
									default: () => [
										h(
											DropdownMenuItem,
											{
												onClick: () =>
													emit(
														"editLink",
														link.originalLink,
														link.subjectId,
														link.eventType,
														link.subject
													),
											},
											{
												default: () => [createIcon("lucide:edit", "!size-4"), "Редагувати"],
											}
										),
										h(
											DropdownMenuItem,
											{
												onClick: () => {
													emit("deleteLink", link.id, link.subjectId, link.eventType)
												},
												class: "text-destructive",
											},
											{
												default: () => [createIcon("lucide:trash-2", "!size-4"), "Видалити"],
											}
										),
									],
								}
							),
						],
					}
				)
			)
		},
	},
]

const sorting = ref<SortingState>([])
const columnFilters = ref<ColumnFiltersState>([])
const columnVisibility = ref<VisibilityState>({})
const rowSelection = ref({})

const table = useVueTable({
	get data() {
		return tableData.value
	},
	get columns() {
		return columns
	},
	onSortingChange: (updaterOrValue) => valueUpdater(updaterOrValue, sorting),
	onColumnFiltersChange: (updaterOrValue) => valueUpdater(updaterOrValue, columnFilters),
	onColumnVisibilityChange: (updaterOrValue) => valueUpdater(updaterOrValue, columnVisibility),
	onRowSelectionChange: (updaterOrValue) => valueUpdater(updaterOrValue, rowSelection),
	getCoreRowModel: getCoreRowModel(),
	getPaginationRowModel: getPaginationRowModel(),
	getSortedRowModel: getSortedRowModel(),
	getFilteredRowModel: getFilteredRowModel(),
	state: {
		get sorting() {
			return sorting.value
		},
		get columnFilters() {
			return columnFilters.value
		},
		get columnVisibility() {
			return columnVisibility.value
		},
		get rowSelection() {
			return rowSelection.value
		},
	},
})

const fileInput = ref<HTMLInputElement | null>(null)

const exportSelected = () => {
	const selectedRows = table.getFilteredSelectedRowModel().rows
	if (selectedRows.length === 0) {
		toast.warning("Не вибрано жодного посилання")
		return
	}

	const selectedData = selectedRows.map((row) => {
		const link = row.original
		return {
			subjectId: link.subjectId,
			subject: link.subject,
			eventType: link.eventType,
			link: link.originalLink,
		}
	})

	const dataStr = JSON.stringify(selectedData, null, 2)
	const blob = new Blob([dataStr], { type: "application/json" })
	const url = URL.createObjectURL(blob)
	const a = document.createElement("a")
	a.href = url
	a.download = `schedule-links-selected-${new Date().toISOString().split("T")[0]}.json`
	document.body.appendChild(a)
	a.click()
	document.body.removeChild(a)
	URL.revokeObjectURL(url)

	toast.success("Експорт завершено", {
		description: `Експортовано ${selectedRows.length} посилань`,
	})
}

const exportAll = () => {
	const allData = tableData.value.map((link) => ({
		subjectId: link.subjectId,
		subject: link.subject,
		eventType: link.eventType,
		link: link.originalLink,
	}))

	const dataStr = JSON.stringify(allData, null, 2)
	const blob = new Blob([dataStr], { type: "application/json" })
	const url = URL.createObjectURL(blob)
	const a = document.createElement("a")
	a.href = url
	a.download = `schedule-links-all-${new Date().toISOString().split("T")[0]}.json`
	document.body.appendChild(a)
	a.click()
	document.body.removeChild(a)
	URL.revokeObjectURL(url)

	toast.success("Експорт завершено", {
		description: `Експортовано ${allData.length} посилань`,
	})
}

const handleImport = (event: Event) => {
	const target = event.target as HTMLInputElement
	const file = target.files?.[0]
	if (!file) return

	emit("importLinks", file)

	if (target) {
		target.value = ""
	}
}
</script>

<template>
	<div class="w-full">
		<div class="py-4">
			<Input
				placeholder="Пошук по назві..."
				:model-value="(table.getColumn('name')?.getFilterValue() as string) ?? ''"
				class="w-full"
				@update:model-value="table.getColumn('name')?.setFilterValue($event)"
			/>
		</div>
		<div class="rounded-md border">
			<Table>
				<TableHeader>
					<TableRow v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
						<TableHead v-for="header in headerGroup.headers" :key="header.id">
							<FlexRender
								v-if="!header.isPlaceholder"
								:render="header.column.columnDef.header"
								:props="header.getContext()"
							/>
						</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					<template v-if="table.getRowModel().rows?.length">
						<TableRow
							v-for="row in table.getRowModel().rows"
							:key="row.id"
							:data-state="row.getIsSelected() && 'selected'"
						>
							<TableCell v-for="cell in row.getVisibleCells()" :key="cell.id">
								<FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" />
							</TableCell>
						</TableRow>
					</template>
					<template v-else>
						<TableRow>
							<TableCell :colspan="columns.length" class="h-24 text-center">
								Немає посилань для відображення
							</TableCell>
						</TableRow>
					</template>
				</TableBody>
			</Table>
		</div>
		<div class="flex items-center justify-between space-x-2 py-4">
			<div class="text-muted-foreground flex-1 text-sm">
				{{ table.getFilteredSelectedRowModel().rows.length }} з
				{{ table.getFilteredRowModel().rows.length }} рядків вибрано.
			</div>
			<div class="space-x-2">
				<Button
					variant="outline"
					size="icon"
					:disabled="!table.getCanPreviousPage()"
					@click="table.previousPage()"
				>
					<Icon name="lucide:chevron-left" />
				</Button>
				<Button
					variant="outline"
					size="icon"
					:disabled="!table.getCanNextPage()"
					@click="table.nextPage()"
				>
					<Icon name="lucide:chevron-right" />
				</Button>
			</div>
		</div>
		<div class="flex w-full flex-wrap items-center justify-center gap-2">
			<Button
				v-if="table.getFilteredSelectedRowModel().rows.length > 0"
				variant="outline"
				size="sm"
				@click="exportSelected"
			>
				<Icon name="lucide:upload" class="mr-2 h-4 w-4" />
				Експортувати вибрані ({{ table.getFilteredSelectedRowModel().rows.length }})
			</Button>

			<Button v-if="tableData.length > 0" variant="outline" size="sm" @click="exportAll">
				<Icon name="lucide:upload" class="mr-2 h-4 w-4" />
				Експортувати все
			</Button>

			<Button
				v-if="table.getFilteredSelectedRowModel().rows.length > 0"
				variant="destructive"
				size="sm"
				@click="deleteSelectedLinks"
			>
				<Icon name="lucide:trash-2" class="!size-4" />
				Видалити вибрані ({{ table.getFilteredSelectedRowModel().rows.length }})
			</Button>
		</div>
		<input ref="fileInput" type="file" accept=".json" class="hidden" @change="handleImport" />
	</div>
</template>
