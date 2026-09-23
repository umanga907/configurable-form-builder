import { describe, expect, it } from 'vitest'
import { findField, findParentId, flatten, insertField, moveField, removeField, siblingPosition, updateField } from './tree.js'

const text = (id, label = id) => ({ id, type: 'text', label, required: false })
const number = (id) => ({ id, type: 'number', label: id, required: false })
const group = (id, children) => ({ id, type: 'group', label: id, required: false, children })

// root: [a, G1[b, G2[c]], d]
const tree = [text('a'), group('G1', [text('b'), group('G2', [number('c')])]), text('d')]

describe('findField / findParentId', () => {
  it('finds fields at any depth', () => {
    expect(findField(tree, 'c')?.id).toBe('c')
    expect(findField(tree, 'nope')).toBeNull()
  })
  it('reports the direct parent, null at root, undefined when missing', () => {
    expect(findParentId(tree, 'a')).toBeNull()
    expect(findParentId(tree, 'b')).toBe('G1')
    expect(findParentId(tree, 'c')).toBe('G2')
    expect(findParentId(tree, 'nope')).toBeUndefined()
  })
})

describe('insertField', () => {
  it('appends at root', () => {
    const next = insertField(tree, null, text('e'))
    expect(next.map((f) => f.id)).toEqual(['a', 'G1', 'd', 'e'])
  })
  it('appends inside a nested group and preserves untouched branches by reference', () => {
    const next = insertField(tree, 'G2', text('e'))
    expect(findField(next, 'G2').children.map((f) => f.id)).toEqual(['c', 'e'])
    expect(next[0]).toBe(tree[0]) // `a` untouched
    expect(next[2]).toBe(tree[2]) // `d` untouched
  })
  it('returns the same array when the parent does not exist', () => {
    expect(insertField(tree, 'missing', text('e'))).toBe(tree)
  })
})

describe('updateField', () => {
  it('patches a nested field without mutating the original', () => {
    const next = updateField(tree, 'c', { label: 'Age', required: true, min: 0 })
    expect(findField(next, 'c')).toMatchObject({ label: 'Age', required: true, min: 0 })
    expect(findField(tree, 'c')).toMatchObject({ label: 'c', required: false })
  })
  it('never changes the type', () => {
    const next = updateField(tree, 'a', { type: 'number' })
    expect(findField(next, 'a').type).toBe('text')
  })
  it('returns the same array when the id is missing', () => {
    expect(updateField(tree, 'missing', { label: 'x' })).toBe(tree)
  })
})

describe('removeField', () => {
  it('removes a leaf inside a nested group', () => {
    const next = removeField(tree, 'c')
    expect(findField(next, 'c')).toBeNull()
    expect(findField(next, 'G2').children).toEqual([])
  })
  it('removes a group together with everything inside it', () => {
    const next = removeField(tree, 'G1')
    expect(next.map((f) => f.id)).toEqual(['a', 'd'])
    expect(findField(next, 'c')).toBeNull()
  })
})

describe('moveField', () => {
  it('moves within the same group only', () => {
    const next = moveField(tree, 'd', 'up')
    expect(next.map((f) => f.id)).toEqual(['a', 'd', 'G1'])
  })
  it('is a no-op at the edges', () => {
    expect(moveField(tree, 'a', 'up')).toBe(tree)
    expect(moveField(tree, 'd', 'down')).toBe(tree)
    expect(moveField(tree, 'c', 'up')).toBe(tree) // only child
  })
  it('moves inside a nested group', () => {
    const withTwo = insertField(tree, 'G2', text('e'))
    const next = moveField(withTwo, 'e', 'up')
    expect(findField(next, 'G2').children.map((f) => f.id)).toEqual(['e', 'c'])
  })
})

describe('siblingPosition / flatten', () => {
  it('reports index and count inside the parent', () => {
    expect(siblingPosition(tree, 'b')).toEqual({ index: 0, count: 2 })
    expect(siblingPosition(tree, 'd')).toEqual({ index: 2, count: 3 })
  })
  it('flattens in document order with depth', () => {
    expect(flatten(tree).map(({ field, depth }) => `${depth}:${field.id}`)).toEqual([
      '0:a', '0:G1', '1:b', '1:G2', '2:c', '0:d',
    ])
  })
})
