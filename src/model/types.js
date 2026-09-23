/**
 * The form configuration is a tree. A group is a field that owns an array of
 * child fields, so nesting is recursive by construction. Every field carries a
 * stable id so the builder can address it without relying on array indexes.
 *
 * Shapes (documented here, enforced by the importer in config-io.js):
 *
 * @typedef {'text' | 'number' | 'group'} FieldType
 *
 * @typedef {Object} TextField
 * @property {string} id
 * @property {'text'} type
 * @property {string} label
 * @property {boolean} required
 *
 * @typedef {Object} NumberField
 * @property {string} id
 * @property {'number'} type
 * @property {string} label
 * @property {boolean} required
 * @property {number} [min]
 * @property {number} [max]
 *
 * @typedef {Object} GroupField
 * @property {string} id
 * @property {'group'} type
 * @property {string} label
 * @property {boolean} required
 * @property {Field[]} children
 *
 * @typedef {TextField | NumberField | GroupField} Field
 *
 * @typedef {Object} FormConfig  The exported / imported document.
 * @property {1} version
 * @property {Field[]} fields
 */

/** @type {readonly FieldType[]} */
export const FIELD_TYPES = Object.freeze(['text', 'number', 'group'])

/** @param {Field} field @returns {field is GroupField} */
export function isGroup(field) {
  return field.type === 'group'
}
