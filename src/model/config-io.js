import { FIELD_TYPES } from './types.js'
import { newId } from './ids.js'

/**
 * Export and import of the configuration as JSON.
 *
 * Export: the tree wrapped in { version, fields }.
 * Import: parse the JSON, then check every field. The first problem stops
 * the import and is reported with a path, for example
 * "fields[1].children[0].min must be a number".
 */

/** @param {import('./types.js').Field[]} fields @returns {string} */
export function exportConfig(fields) {
  return JSON.stringify({ version: 1, fields }, null, 2)
}

/**
 * @param {string} json
 * @returns {{ ok: true, fields: import('./types.js').Field[] } | { ok: false, error: string }}
 */
export function parseConfig(json) {
  let data
  try {
    data = JSON.parse(json)
  } catch (e) {
    return { ok: false, error: `Not valid JSON: ${e.message}` }
  }

  // Accept the full document { version, fields } or a bare array of fields.
  const rawFields = Array.isArray(data) ? data : data?.fields
  if (!Array.isArray(rawFields)) {
    return { ok: false, error: 'Expected { "version": 1, "fields": [ ... ] } or an array of fields' }
  }

  try {
    return { ok: true, fields: rawFields.map((raw, i) => checkField(raw, `fields[${i}]`)) }
  } catch (e) {
    return { ok: false, error: e.message }
  }
}

/**
 * Checks one field and returns a clean copy of it. Throws on the first
 * problem. Recurses into group children.
 * @param {unknown} raw
 * @param {string} path  where we are, for the error message
 * @returns {import('./types.js').Field}
 */
function checkField(raw, path) {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    throw new Error(`${path} must be an object`)
  }
  if (!FIELD_TYPES.includes(raw.type)) {
    throw new Error(`${path}.type must be one of: ${FIELD_TYPES.join(', ')}`)
  }
  if (raw.label !== undefined && typeof raw.label !== 'string') {
    throw new Error(`${path}.label must be a string`)
  }
  if (raw.required !== undefined && typeof raw.required !== 'boolean') {
    throw new Error(`${path}.required must be true or false`)
  }

  // A missing id is the one thing we fix instead of rejecting: it is our
  // internal handle, not something a person should have to write by hand.
  const field = {
    id: typeof raw.id === 'string' && raw.id !== '' ? raw.id : newId(),
    type: raw.type,
    label: raw.label ?? '',
    required: raw.required ?? false,
  }

  if (raw.type === 'number') {
    for (const key of ['min', 'max']) {
      if (raw[key] === undefined || raw[key] === null) continue
      if (typeof raw[key] !== 'number' || Number.isNaN(raw[key])) {
        throw new Error(`${path}.${key} must be a number`)
      }
      field[key] = raw[key]
    }
    if (field.min !== undefined && field.max !== undefined && field.min > field.max) {
      throw new Error(`${path}: min (${field.min}) is greater than max (${field.max})`)
    }
  }

  if (raw.type === 'group') {
    const children = raw.children ?? []
    if (!Array.isArray(children)) throw new Error(`${path}.children must be an array`)
    field.children = children.map((child, i) => checkField(child, `${path}.children[${i}]`))
  }

  return field
}
