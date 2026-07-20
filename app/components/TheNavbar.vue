<template>
	<div
		class="bg-muted/50 flex w-full items-center gap-0.5 px-1 py-2 md:hidden [&_button]:size-8
			[&_button_svg]:size-3.5"
	>
		<div class="shrink-0">
			<UiDrawer direction="left">
				<UiDrawerTrigger as-child>
					<UiButton variant="ghost" size="icon" aria-label="Відкрити меню">
						<AppIcon name="lucide:menu" />
					</UiButton>
				</UiDrawerTrigger>
				<UiDrawerContent hide-knob>
					<div class="h-full p-3">
						<TheSidebar :show-add-dialog="false" />
					</div>
				</UiDrawerContent>
			</UiDrawer>
		</div>

		<div class="min-w-0 flex-1 overflow-hidden">
			<BigCalendarDateNavigator />
		</div>

		<div class="flex shrink-0 items-center gap-1">
			<FiltersDialog variant="ghost" />
			<BigCalendarViewSwitcher variant="iconOnly" />
			<ThemeSwitcher />
		</div>
	</div>

	<div class="hidden w-full grid-cols-3 items-center md:grid">
		<TheLogo />
		<div class="flex items-center justify-center">
			<BigCalendarDateNavigator />
		</div>
		<div class="flex items-center justify-end gap-3">
			<PlayMarketButton variant="button" />
			<BigCalendarViewSwitcher />
			<ThemeSwitcher />
		</div>
	</div>
</template>
