import { newId } from './ids.js'
import { findField, insertField, moveField, removeField, updateField } from './tree.js'

/**
 * Builder state and reducer. One tree, one selected id. Everything the UI does
 * is one of these actions, so the whole builder can be replayed and tested
 * without rendering anything.
 *
 * @typedef {Object} BuilderState
 * @property {import('./types.js').Field[]} fields
 * @property {string | null} selectedId
 *
 * @typedef {(
 *   | { type: 'ADD_FIELD', parentId: string | null, fieldType: import('./types.js').FieldType }
 *   | { type: 'UPDATE_FIELD', id: string, patch: Partial<import('./types.js').Field> }
 *   | { type: 'DELETE_FIELD', id: string }
 *   | { type: 'MOVE_FIELD', id: string, direction: 'up' | 'down' }
 *   | { type: 'SELECT_FIELD', id: string | null }
 *   | { type: 'REPLACE_ALL', fields: import('./types.js').Field[] }
 *   | { type: 'RESET' }
 * )} BuilderAction
 */

/** @type {BuilderState} */
export const initialState = Object.freeze({ fields: [], selectedId: null })

const DEFAULT_LABELS = {
  text: 'Text field',
  number: 'Number field',
  group: 'Group',
}

/**
 * Builds a fresh field of the given type with sensible defaults.
 * @param {import('./types.js').FieldType} fieldType
 * @param {string} [label]
 * @returns {import('./types.js').Field}
 */
export function createField(fieldType, label = DEFAULT_LABELS[fieldType]) {
  const base = { id: newId(), label, required: false }
  switch (fieldType) {
    case 'text':
      return { ...base, type: 'text' }
    case 'number':
      return { ...base, type: 'number' }
    case 'group':
      return { ...base, type: 'group', children: [] }
    default:
      throw new Error(`Unknown field type: ${fieldType}`)
  }
}

/**
 * @param {BuilderState} state
 * @param {BuilderAction} action
 * @returns {BuilderState}
 */
export function builderReducer(state, action) {
  switch (action.type) {
    case 'ADD_FIELD': {
      const field = createField(action.fieldType)
      const fields = insertField(state.fields, action.parentId, field)
      // Adding into a parent that no longer exists is a no-op.
      if (fields === state.fields) return state
      return { fields, selectedId: field.id }
    }
    case 'UPDATE_FIELD': {
      const fields = updateField(state.fields, action.id, action.patch)
      return fields === state.fields ? state : { ...state, fields }
    }
    case 'DELETE_FIELD': {
      const fields = removeField(state.fields, action.id)
      if (fields === state.fields) return state
      // If the selection was deleted (or lived inside a deleted group), clear it.
      const selectedId =
        state.selectedId && findField(fields, state.selectedId) ? state.selectedId : null
      return { fields, selectedId }
    }
    case 'MOVE_FIELD': {
      const fields = moveField(state.fields, action.id, action.direction)
      return fields === state.fields ? state : { ...state, fields }
    }
    case 'SELECT_FIELD':
      return state.selectedId === action.id ? state : { ...state, selectedId: action.id }
    case 'REPLACE_ALL':
      return { fields: action.fields, selectedId: null }
    case 'RESET':
      return initialState
    default:
      return state
  }
}
