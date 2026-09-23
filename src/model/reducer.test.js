import { describe, expect, it } from 'vitest'
import { builderReducer, initialState } from './reducer.js'
import { findField } from './tree.js'

const run = (actions, start = initialState) => actions.reduce(builderReducer, start)

describe('builderReducer', () => {
  it('adds a field at root and selects it', () => {
    const s = run([{ type: 'ADD_FIELD', parentId: null, fieldType: 'text' }])
    expect(s.fields).toHaveLength(1)
    expect(s.fields[0].type).toBe('text')
    expect(s.selectedId).toBe(s.fields[0].id)
  })

  it('adds a field inside a group, recursively', () => {
    let s = run([{ type: 'ADD_FIELD', parentId: null, fieldType: 'group' }])
    const outer = s.fields[0].id
    s = builderReducer(s, { type: 'ADD_FIELD', parentId: outer, fieldType: 'group' })
    const inner = s.selectedId
    s = builderReducer(s, { type: 'ADD_FIELD', parentId: inner, fieldType: 'number' })
    expect(findField(s.fields, inner).children[0].type).toBe('number')
  })

  it('updates properties', () => {
    let s = run([{ type: 'ADD_FIELD', parentId: null, fieldType: 'number' }])
    const id = s.selectedId
    s = builderReducer(s, { type: 'UPDATE_FIELD', id, patch: { label: 'Qty', required: true, min: 1, max: 10 } })
    expect(findField(s.fields, id)).toMatchObject({ label: 'Qty', required: true, min: 1, max: 10 })
  })

  it('clears the selection when the selected field is deleted, even inside a group', () => {
    let s = run([{ type: 'ADD_FIELD', parentId: null, fieldType: 'group' }])
    const g = s.fields[0].id
    s = builderReducer(s, { type: 'ADD_FIELD', parentId: g, fieldType: 'text' })
    expect(s.selectedId).not.toBe(g)
    s = builderReducer(s, { type: 'DELETE_FIELD', id: g })
    expect(s.fields).toEqual([])
    expect(s.selectedId).toBeNull()
  })

  it('keeps the selection when a different field is deleted', () => {
    let s = run([
      { type: 'ADD_FIELD', parentId: null, fieldType: 'text' },
      { type: 'ADD_FIELD', parentId: null, fieldType: 'text' },
    ])
    const [first, second] = s.fields.map((f) => f.id)
    s = builderReducer(s, { type: 'SELECT_FIELD', id: first })
    s = builderReducer(s, { type: 'DELETE_FIELD', id: second })
    expect(s.selectedId).toBe(first)
  })

  it('moves fields and returns the same state for no-op moves', () => {
    const s = run([
      { type: 'ADD_FIELD', parentId: null, fieldType: 'text' },
      { type: 'ADD_FIELD', parentId: null, fieldType: 'number' },
    ])
    const [a, b] = s.fields.map((f) => f.id)
    const moved = builderReducer(s, { type: 'MOVE_FIELD', id: b, direction: 'up' })
    expect(moved.fields.map((f) => f.id)).toEqual([b, a])
    expect(builderReducer(moved, { type: 'MOVE_FIELD', id: b, direction: 'up' })).toBe(moved)
  })

  it('replaces everything on import and resets', () => {
    let s = run([{ type: 'ADD_FIELD', parentId: null, fieldType: 'text' }])
    s = builderReducer(s, { type: 'REPLACE_ALL', fields: [{ id: 'x', type: 'text', label: 'X', required: true }] })
    expect(s.fields[0].id).toBe('x')
    expect(s.selectedId).toBeNull()
    expect(builderReducer(s, { type: 'RESET' })).toBe(initialState)
  })

  it('returns the same state object for actions that change nothing', () => {
    const s = run([{ type: 'ADD_FIELD', parentId: null, fieldType: 'text' }])
    expect(builderReducer(s, { type: 'UPDATE_FIELD', id: 'missing', patch: { label: 'x' } })).toBe(s)
    expect(builderReducer(s, { type: 'DELETE_FIELD', id: 'missing' })).toBe(s)
    expect(builderReducer(s, { type: 'ADD_FIELD', parentId: 'missing', fieldType: 'text' })).toBe(s)
    expect(builderReducer(s, { type: 'SELECT_FIELD', id: s.selectedId })).toBe(s)
    expect(builderReducer(s, { type: 'UNKNOWN' })).toBe(s)
  })
})
