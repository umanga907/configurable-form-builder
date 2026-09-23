import { isGroup } from './types.js'

/**
 * Pure, immutable operations on the field tree.
 *
 * Every function returns a new array when something changed and the SAME
 * array reference when nothing did. That lets React.memo'd components skip
 * re-rendering untouched branches, and it keeps the reducer trivially
 * testable: no classes, no mutation, no side effects.
 *
 * All functions are recursive because groups may contain groups.
 */

/**
 * Depth-first search for a field by id.
 * @param {import('./types.js').Field[]} fields
 * @param {string} id
 * @returns {import('./types.js').Field | null}
 */
export function findField(fields, id) {
  for (const field of fields) {
    if (field.id === id) return field
    if (isGroup(field)) {
      const hit = findField(field.children, id)
      if (hit) return hit
    }
  }
  return null
}

/**
 * Id of the group that directly contains `id`.
 * Returns null when the field is at root, undefined when it does not exist.
 * @param {import('./types.js').Field[]} fields
 * @param {string} id
 * @param {string | null} [parentId]
 * @returns {string | null | undefined}
 */
export function findParentId(fields, id, parentId = null) {
  for (const field of fields) {
    if (field.id === id) return parentId
    if (isGroup(field)) {
      const hit = findParentId(field.children, id, field.id)
      if (hit !== undefined) return hit
    }
  }
  return undefined
}

/**
 * Applies `fn` to the children array of group `parentId` (root when null).
 * @param {import('./types.js').Field[]} fields
 * @param {string | null} parentId
 * @param {(children: import('./types.js').Field[]) => import('./types.js').Field[]} fn
 */
export function updateChildren(fields, parentId, fn) {
  if (parentId === null) return fn(fields)
  let changed = false
  const next = fields.map((field) => {
    if (!isGroup(field)) return field
    if (field.id === parentId) {
      const children = fn(field.children)
      if (children === field.children) return field
      changed = true
      return { ...field, children }
    }
    const children = updateChildren(field.children, parentId, fn)
    if (children === field.children) return field
    changed = true
    return { ...field, children }
  })
  return changed ? next : fields
}

/**
 * Appends a field to the given group (root when parentId is null).
 * @param {import('./types.js').Field[]} fields
 * @param {string | null} parentId
 * @param {import('./types.js').Field} field
 */
export function insertField(fields, parentId, field) {
  return updateChildren(fields, parentId, (children) => [...children, field])
}

/**
 * Shallow-merges `patch` into the field with `id`, wherever it is in the tree.
 * `type` is never patched here; changing type would be a different operation.
 * @param {import('./types.js').Field[]} fields
 * @param {string} id
 * @param {Partial<import('./types.js').Field>} patch
 */
export function updateField(fields, id, patch) {
  let changed = false
  const next = fields.map((field) => {
    if (field.id === id) {
      changed = true
      const { type: _ignored, ...rest } = patch
      return { ...field, ...rest }
    }
    if (isGroup(field)) {
      const children = updateField(field.children, id, patch)
      if (children !== field.children) {
        changed = true
        return { ...field, children }
      }
    }
    return field
  })
  return changed ? next : fields
}

/**
 * Removes the field with `id` (and, for groups, everything inside it).
 * @param {import('./types.js').Field[]} fields
 * @param {string} id
 */
export function removeField(fields, id) {
  let changed = false
  const next = []
  for (const field of fields) {
    if (field.id === id) {
      changed = true
      continue
    }
    if (isGroup(field)) {
      const children = removeField(field.children, id)
      if (children !== field.children) {
        changed = true
        next.push({ ...field, children })
        continue
      }
    }
    next.push(field)
  }
  return changed ? next : fields
}

/**
 * Swaps the field with its neighbour inside the same group. No-op at the edges.
 * @param {import('./types.js').Field[]} fields
 * @param {string} id
 * @param {'up' | 'down'} direction
 */
export function moveField(fields, id, direction) {
  const parentId = findParentId(fields, id)
  if (parentId === undefined) return fields
  return updateChildren(fields, parentId, (children) => {
    const index = children.findIndex((f) => f.id === id)
    const target = direction === 'up' ? index - 1 : index + 1
    if (index === -1 || target < 0 || target >= children.length) return children
    const next = [...children]
    ;[next[index], next[target]] = [next[target], next[index]]
    return next
  })
}

/**
 * Position of the field inside its group: index and sibling count.
 * @param {import('./types.js').Field[]} fields
 * @param {string} id
 * @returns {{ index: number, count: number } | null}
 */
export function siblingPosition(fields, id) {
  const parentId = findParentId(fields, id)
  if (parentId === undefined) return null
  const siblings = parentId === null ? fields : findField(fields, parentId).children
  return { index: siblings.findIndex((f) => f.id === id), count: siblings.length }
}

/**
 * Every field in document order, with its depth.
 * @param {import('./types.js').Field[]} fields
 * @param {number} [depth]
 * @returns {Array<{ field: import('./types.js').Field, depth: number }>}
 */
export function flatten(fields, depth = 0) {
  const out = []
  for (const field of fields) {
    out.push({ field, depth })
    if (isGroup(field)) out.push(...flatten(field.children, depth + 1))
  }
  return out
}
