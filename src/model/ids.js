let counter = 0

/**
 * Stable, unique ids for fields. Uses the platform UUID when available and
 * falls back to a counter so tests and older environments still work.
 * @returns {string}
 */
export function newId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  counter += 1
  return `f_${Date.now().toString(36)}_${counter}`
}
