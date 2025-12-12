<template>
	<Dialog>
		<DialogTrigger as-child>
			<Button size="icon" variant="outline">
				<AppIcon name="lucide:settings" />
			</Button>
		</DialogTrigger>
		<DialogContent class="flex h-[40vh] flex-col overflow-hidden sm:max-w-2xl">
			<DialogHeader>
				<DialogTitle>Налаштування</DialogTitle>
			</DialogHeader>
			<SettingsMainView class="flex-1" />
		</DialogContent>
	</Dialog>
</template>
