<script setup lang="ts">
const { trackEvent } = useAnalytics()
</script>

<template>
	<div class="flex min-h-0 flex-1 flex-col gap-4 py-4">
		<UiTabs
			default-value="schedule"
			class="flex min-h-0 flex-1 flex-col"
			@update:model-value="
				trackEvent('settings_tab_changed', { tab: $event as 'schedule' | 'links' | 'bug' })
			"
		>
			<UiTabsList class="grid w-full shrink-0 grid-cols-3">
				<UiTabsTrigger value="schedule">Загальні</UiTabsTrigger>
				<UiTabsTrigger value="links">Посилання</UiTabsTrigger>
				<UiTabsTrigger value="bug">Діагностика</UiTabsTrigger>
			</UiTabsList>

			<UiTabsContent value="schedule" class="min-h-0 flex-1">
				<SettingsScheduleTab />
			</UiTabsContent>

			<UiTabsContent value="links" class="min-h-0 flex-1">
				<div class="overflow-x-hidden overflow-y-auto">
					<SettingsLinksManagement />
				</div>
			</UiTabsContent>

			<UiTabsContent value="bug" class="min-h-0 flex-1">
				<SettingsDiagnosticsTab />
			</UiTabsContent>
		</UiTabs>
	</div>
</template>
