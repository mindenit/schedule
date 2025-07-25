<template>
	<Dialog>
		<DialogTrigger as-child>
			<Button size="icon" variant="outline">
				<Icon name="lucide:settings" class="!size-4" />
			</Button>
		</DialogTrigger>
		<DialogContent class="flex max-h-[80vh] max-w-2xl flex-col overflow-hidden">
			<DialogHeader>
				<DialogTitle>Налаштування</DialogTitle>
			</DialogHeader>
			<SettingsMainView />
		</DialogContent>
	</Dialog>
</template>
