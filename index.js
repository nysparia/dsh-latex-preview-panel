/**
 * dsh-latex-preview-panel — host half.
 *
 * The whole behaviour is a browser section plus a stylesheet: this package
 * exists so a row resolves at boot and its `exports["./client"]` reaches the
 * client module graph. Nothing is served, registered, or stored here.
 */

/** Cordis plugin name. */
export const name = 'latex-preview'

/** No host services: nothing to inject. */
export const inject = []

/** No host-side work. */
export function apply() {}
