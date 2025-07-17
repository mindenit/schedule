<template>
	<div class="bg-muted/50 grid w-full max-w-full grid-cols-3 items-center px-2 py-2 md:hidden">
		<div class="flex shrink-0 items-center">
			<Drawer direction="left">
				<DrawerTrigger as-child>
					<Button variant="ghost" size="icon">
						<Icon class="!size-4" name="lucide:menu" />
					</Button>
				</DrawerTrigger>
				<DrawerContent>
					<div class="h-full p-3">
						<TheSidebar :show-add-dialog="false" />
					</div>
				</DrawerContent>
			</Drawer>
		</div>

		<div class="flex items-center justify-center">
			<BigCalendarDateNavigator />
		</div>

		<div class="flex items-center justify-end gap-3">
			<div class="max-w-fit shrink-0">
				<ThemeSwitcher />
			</div>
		</div>
	</div>

	<div class="hidden w-full grid-cols-3 items-center md:grid">
		<TheLogo />
		<div class="flex items-center justify-center">
			<BigCalendarDateNavigator />
		</div>
		<div class="flex items-center justify-end gap-3">
			<BigCalendarViewSwitcher />
			<ThemeSwitcher />
		</div>
	</div>
</template>
