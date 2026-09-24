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

describe('export then import', () => {
  it('gives back the same tree', () => {
    const json = exportConfig(sample)
    expect(JSON.parse(json).version).toBe(1)
    const result = parseConfig(json)
    expect(result.ok).toBe(true)
    expect(result.fields).toEqual(sample)
  })
})

describe('parseConfig', () => {
  it('rejects invalid JSON with a readable message', () => {
    const r = parseConfig('{ not json')
    expect(r.ok).toBe(false)
    expect(r.error).toMatch(/Not valid JSON/)
  })
  it('accepts a bare array of fields', () => {
    expect(parseConfig(JSON.stringify(sample)).ok).toBe(true)
  })
  it('rejects a document that is neither an array nor { fields }', () => {
    expect(parseConfig('{"version":1}').ok).toBe(false)
    expect(parseConfig('42').ok).toBe(false)
  })
  it('rejects an unknown type and says where', () => {
    const r = parseConfig(JSON.stringify({ fields: [{ id: 'a', type: 'date', label: 'A' }] }))
    expect(r.ok).toBe(false)
    expect(r.error).toBe('fields[0].type must be one of: text, number, group')
  })
  it('rejects a bad min inside a nested group, with the full path', () => {
    const r = parseConfig(JSON.stringify({
      fields: [{ id: 'g', type: 'group', label: 'G', children: [{ id: 'n', type: 'number', label: 'N', min: '5' }] }],
    }))
    expect(r.ok).toBe(false)
    expect(r.error).toBe('fields[0].children[0].min must be a number')
  })
  it('rejects min greater than max', () => {
    const r = parseConfig(JSON.stringify([{ id: 'm', type: 'number', label: 'M', min: 9, max: 1 }]))
    expect(r.ok).toBe(false)
    expect(r.error).toMatch(/min \(9\) is greater than max \(1\)/)
  })
  it('rejects a group whose children is not an array', () => {
    expect(parseConfig(JSON.stringify([{ id: 'g', type: 'group', label: 'G', children: 'x' }])).ok).toBe(false)
  })
  it('fills in a missing id, label and required', () => {
    const r = parseConfig(JSON.stringify([{ type: 'text' }]))
    expect(r.ok).toBe(true)
    expect(r.fields[0]).toMatchObject({ type: 'text', label: '', required: false })
    expect(typeof r.fields[0].id).toBe('string')
    expect(r.fields[0].id.length).toBeGreaterThan(0)
  })
})
