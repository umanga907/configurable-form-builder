import { describe, expect, it } from 'vitest'
import { exportConfig, parseConfig } from './config-io.js'

const sample = [
  { id: 'name', type: 'text', label: 'Name', required: true },
  {
    id: 'address', type: 'group', label: 'Address', required: false, children: [
      { id: 'zip', type: 'number', label: 'ZIP', required: true, min: 0, max: 99999 },
      { id: 'inner', type: 'group', label: 'Inner', required: false, children: [] },
    ],
  },
]

describe('export → import round trip', () => {
  it('reproduces the same tree', () => {
    const json = exportConfig(sample)
    expect(JSON.parse(json).version).toBe(1)
    const result = parseConfig(json)
    expect(result.ok).toBe(true)
    expect(result.fields).toEqual(sample)
    expect(result.warnings).toEqual([])
  })
})

describe('parseConfig', () => {
  it('rejects invalid JSON with a readable message', () => {
    const r = parseConfig('{ not json')
    expect(r.ok).toBe(false)
    expect(r.errors[0]).toMatch(/Not valid JSON/)
  })
  it('accepts a bare array of fields', () => {
    expect(parseConfig(JSON.stringify(sample)).ok).toBe(true)
  })
  it('rejects unknown types with a path', () => {
    const r = parseConfig(JSON.stringify({ fields: [{ id: 'a', type: 'date', label: 'A' }] }))
    expect(r.ok).toBe(false)
    expect(r.errors[0]).toMatch(/^fields\[0\]\.type/)
  })
  it('rejects non-numeric min/max and min > max, with nested paths', () => {
    const r = parseConfig(JSON.stringify({
      fields: [{ id: 'g', type: 'group', label: 'G', children: [
        { id: 'n', type: 'number', label: 'N', min: '5' },
        { id: 'm', type: 'number', label: 'M', min: 9, max: 1 },
      ] }],
    }))
    expect(r.ok).toBe(false)
    expect(r.errors).toHaveLength(2)
    expect(r.errors[0]).toMatch(/fields\[0\]\.children\[0\]\.min/)
    expect(r.errors[1]).toMatch(/min \(9\) is greater than max \(1\)/)
  })
  it('repairs missing ids, duplicate ids and missing labels with warnings', () => {
    const r = parseConfig(JSON.stringify({ fields: [
      { type: 'text' },
      { id: 'dup', type: 'text', label: 'One' },
      { id: 'dup', type: 'text', label: 'Two' },
    ] }))
    expect(r.ok).toBe(true)
    expect(r.fields).toHaveLength(3)
    expect(new Set(r.fields.map((f) => f.id)).size).toBe(3)
    const w = r.warnings.join('\n')
    expect(w).toMatch(/missing, a new id/)
    expect(w).toMatch(/duplicate id "dup"/)
    expect(w).toMatch(/label: missing/)
  })
  it('rejects a group whose children is not an array', () => {
    expect(parseConfig(JSON.stringify({ fields: [{ id: 'g', type: 'group', label: 'G', children: 'x' }] })).ok).toBe(false)
  })
  it('rejects a document that is neither an array nor { fields }', () => {
    expect(parseConfig('{"version":1}').ok).toBe(false)
    expect(parseConfig('42').ok).toBe(false)
  })
})
