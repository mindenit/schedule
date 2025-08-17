<script lang="ts" setup>
import "vue-sonner/style.css"

useHead({
	script: [
		{
			innerHTML: `
(function() {
  const getTheme = () => {
    const storedTheme = localStorage.getItem('nuxt-color-mode');
    if (storedTheme && storedTheme !== 'system') {
      return storedTheme;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };
  const theme = getTheme();
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  }
})();
      `.trim(),
		},
		{
			src: "https://analytics.mindenit.org/api/script.js",
			defer: true,
			"data-site-id": "3",
			"data-track-errors": "true",
			"data-session-replay": "true",
		},
	],
})
</script>

<template>
	<NuxtRouteAnnouncer />
	<NuxtLayout>
		<NuxtPage />
	</NuxtLayout>
	<Toaster position="top-right" richColors />
</template>
