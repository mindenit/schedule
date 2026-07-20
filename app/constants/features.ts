/**
 * Feature flags — set to `true` to enable, `false` to hide from all users.
 *
 * These are compile-time constants. Changing a flag requires a rebuild.
 * Use them to ship incomplete features safely without deleting code.
 */

/** Share-links flow (ShareLinksDialog + "Поділитися" button in links management).
 *  The backend endpoint is not yet available in production. */
export const SHARE_LINKS = true
