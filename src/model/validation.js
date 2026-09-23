import { isGroup } from './types.js'

/**
 * Validation for the live preview. Values are kept as the raw strings the
 * user typed, so we can show exactly what they entered and explain why it is
 * wrong, instead of silently coercing.
 *
 * @typedef {Record<string, string>} FormValues   fieldId -> raw input
 * @typedef {Record<string, string>} FormErrors   fieldId -> message
 */

/**
 * Parses a number input the way a user expects: trimmed, decimal, no NaN leaks.
 * Rejects "1e5", "0x10", "12abc", "Infinity".
 * @param {string} raw
 * @returns {number | null}
 */
export function parseNumber(raw) {
  const trimmed = raw.trim()
  if (trimmed === '') return null
  if (!/^-?\d+(\.\d+)?$/.test(trimmed)) return null
  const n = Number(trimmed)
  return Number.isFinite(n) ? n : null
}

/**
 * Error message for one leaf field, or null when it is valid.
 * @param {import('./types.js').Field} field
 * @param {string | undefined} raw
 * @returns {string | null}
 */
export function validateValue(field, raw) {
  const value = raw ?? ''
  const empty = value.trim() === ''

  if (field.required && empty) return 'This field is required.'
  if (empty) return null

  if (field.type === 'number') {
    const n = parseNumber(value)
    if (n === null) return 'Enter a valid number.'
    if (field.min !== undefined && n < field.min) return `Must be at least ${field.min}.`
    if (field.max !== undefined && n > field.max) return `Must be at most ${field.max}.`
  }
  return null
}

/**
 * Walks the tree and validates every leaf. Groups themselves hold no value.
 * @param {import('./types.js').Field[]} fields
 * @param {FormValues} values
 * @returns {FormErrors}
 */
export function validateForm(fields, values) {
  /** @type {FormErrors} */
  const errors = {}
  const walk = (list) => {
    for (const field of list) {
      if (isGroup(field)) {
        walk(field.children)
        continue
      }
      const error = validateValue(field, values[field.id])
      if (error) errors[field.id] = error
    }
  }
  walk(fields)
  return errors
}

/**
 * The builder itself can be misconfigured (min > max, empty label). Surface it.
 * @param {import('./types.js').Field[]} fields
 * @returns {Record<string, string>}
 */
export function configWarnings(fields) {
  /** @type {Record<string, string>} */
  const warnings = {}
  const walk = (list) => {
    for (const field of list) {
      if (field.type === 'number' && field.min !== undefined && field.max !== undefined && field.min > field.max) {
        warnings[field.id] = 'min is greater than max'
      }
      if (field.label.trim() === '') warnings[field.id] = 'label is empty'
      if (isGroup(field)) walk(field.children)
    }
  }
  walk(fields)
  return warnings
}
