import { FIELD_TYPES } from './types.js'
import { newId } from './ids.js'

/**
 * Export and import of the configuration as JSON.
 *
 * Export is trivial. Import is where a user pastes anything, so it is
 * validated structurally, one field at a time, and every problem is reported
 * with a path like `fields[1].children[0].min` instead of a stack trace.
 *
 * @typedef {{ ok: true, fields: import('./types.js').Field[], warnings: string[] } |
 *           { ok: false, errors: string[] }} ImportResult
 */

/** @param {import('./types.js').Field[]} fields @returns {string} */
export function exportConfig(fields) {
  return JSON.stringify({ version: 1, fields }, null, 2)
}

const MAX_DEPTH = 32

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * @param {unknown} raw
 * @param {string} path
 * @param {number} depth
 * @param {string[]} errors
 * @param {string[]} warnings
 * @param {Set<string>} seenIds
 * @returns {import('./types.js').Field | null}
 */
function parseField(raw, path, depth, errors, warnings, seenIds) {
  if (!isRecord(raw)) {
    errors.push(`${path}: expected an object`)
    return null
  }
  const type = raw.type
  if (typeof type !== 'string' || !FIELD_TYPES.includes(type)) {
    errors.push(`${path}.type: expected one of ${FIELD_TYPES.join(', ')}`)
    return null
  }

  let id
  if (typeof raw.id === 'string' && raw.id.trim() !== '') {
    id = raw.id
    if (seenIds.has(id)) {
      warnings.push(`${path}.id: duplicate id "${id}" was replaced`)
      id = newId()
    }
  } else {
    warnings.push(`${path}.id: missing, a new id was generated`)
    id = newId()
  }
  seenIds.add(id)

  const label = typeof raw.label === 'string' ? raw.label : ''
  if (typeof raw.label !== 'string') warnings.push(`${path}.label: missing, set to empty`)

  const required = raw.required === true
  if (raw.required !== undefined && typeof raw.required !== 'boolean') {
    warnings.push(`${path}.required: not a boolean, treated as false`)
  }

  switch (type) {
    case 'text':
      return { id, type, label, required }

    case 'number': {
      const field = { id, type, label, required }
      for (const key of ['min', 'max']) {
        const v = raw[key]
        if (v === undefined || v === null) continue
        if (typeof v !== 'number' || !Number.isFinite(v)) {
          errors.push(`${path}.${key}: expected a number`)
          continue
        }
        field[key] = v
      }
      if (field.min !== undefined && field.max !== undefined && field.min > field.max) {
        errors.push(`${path}: min (${field.min}) is greater than max (${field.max})`)
      }
      return field
    }

    case 'group': {
      if (depth >= MAX_DEPTH) {
        errors.push(`${path}: groups nested deeper than ${MAX_DEPTH} levels`)
        return null
      }
      const rawChildren = raw.children ?? []
      if (!Array.isArray(rawChildren)) {
        errors.push(`${path}.children: expected an array`)
        return null
      }
      const children = []
      rawChildren.forEach((child, i) => {
        const parsed = parseField(child, `${path}.children[${i}]`, depth + 1, errors, warnings, seenIds)
        if (parsed) children.push(parsed)
      })
      return { id, type, label, required, children }
    }

    default:
      return null
  }
}

/**
 * Parses pasted JSON into a field tree, or explains exactly what is wrong.
 * Accepts the full document { version, fields } or a bare array of fields.
 * @param {string} json
 * @returns {ImportResult}
 */
export function parseConfig(json) {
  let data
  try {
    data = JSON.parse(json)
  } catch (e) {
    return { ok: false, errors: [`Not valid JSON: ${e.message}`] }
  }

  let rawFields
  if (Array.isArray(data)) rawFields = data
  else if (isRecord(data) && Array.isArray(data.fields)) rawFields = data.fields
  else return { ok: false, errors: ['Expected { "version": 1, "fields": [...] } or an array of fields'] }

  const errors = []
  const warnings = []
  const seenIds = new Set()
  const fields = []
  rawFields.forEach((raw, i) => {
    const parsed = parseField(raw, `fields[${i}]`, 0, errors, warnings, seenIds)
    if (parsed) fields.push(parsed)
  })

  if (errors.length > 0) return { ok: false, errors }
  return { ok: true, fields, warnings }
}
