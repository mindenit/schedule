import { toValue } from "vue"
import type { MaybeRefOrGetter } from "vue"

interface UseSeoOptions {
	title: MaybeRefOrGetter<string>
	description?: MaybeRefOrGetter<string>
	noindex?: boolean
	ogImage?: {
		title?: MaybeRefOrGetter<string>
		description?: MaybeRefOrGetter<string>
		headline?: string
	}
}

export function useSeo(opts: UseSeoOptions) {
	const title = computed(() => toValue(opts.title))
	const description = computed(() =>
		opts.description ? toValue(opts.description) : SEO_DEFAULT_DESCRIPTION
	)

	useSeoMeta({
		title,
		ogTitle: title,
		description,
		ogDescription: description,
		twitterTitle: title,
		twitterDescription: description,
		...(opts.noindex ? { robots: "noindex, nofollow" } : {}),
	})

	defineOgImage("Mindenit", {
		title: computed(() => toValue(opts.ogImage?.title ?? opts.title)),
		description: computed(() =>
			opts.ogImage?.description
				? toValue(opts.ogImage.description)
				: opts.description
					? toValue(opts.description)
					: SEO_DEFAULT_DESCRIPTION
		),
		headline: opts.ogImage?.headline ?? SEO_SITE_SHORT_NAME,
	})
}
