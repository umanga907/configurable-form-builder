import { describe, expect, it } from 'vitest'
import { configWarnings, parseNumber, validateForm, validateValue } from './validation.js'

const text = (id, required = false) => ({ id, type: 'text', label: id, required })
const number = (id, opts = {}) => ({
  id, type: 'number', label: id, required: opts.required ?? false, min: opts.min, max: opts.max,
})

describe('parseNumber', () => {
  it('accepts plain decimals and rejects everything else', () => {
    expect(parseNumber('42')).toBe(42)
    expect(parseNumber(' -3.5 ')).toBe(-3.5)
    expect(parseNumber('')).toBeNull()
    expect(parseNumber('abc')).toBeNull()
    expect(parseNumber('12abc')).toBeNull()
    expect(parseNumber('1e5')).toBeNull()
    expect(parseNumber('0x10')).toBeNull()
    expect(parseNumber('Infinity')).toBeNull()
  })
})

describe('validateValue', () => {
  it('requires required fields and allows empty optional ones', () => {
    expect(validateValue(text('a', true), '')).toMatch(/required/)
    expect(validateValue(text('a', true), '   ')).toMatch(/required/)
    expect(validateValue(text('a'), '')).toBeNull()
    expect(validateValue(text('a', true), 'hi')).toBeNull()
  })
  it('rejects text in a number field predictably', () => {
    expect(validateValue(number('n'), 'abc')).toMatch(/valid number/)
    expect(validateValue(number('n'), '12abc')).toMatch(/valid number/)
    expect(validateValue(number('n'), '12')).toBeNull()
  })
  it('enforces min and max, inclusive', () => {
    const f = number('n', { min: 1, max: 10 })
    expect(validateValue(f, '0')).toMatch(/at least 1/)
    expect(validateValue(f, '1')).toBeNull()
    expect(validateValue(f, '10')).toBeNull()
    expect(validateValue(f, '11')).toMatch(/at most 10/)
  })
})

describe('validateForm', () => {
  it('walks nested groups and only reports leaves', () => {
    const fields = [
      text('a', true),
      { id: 'G', type: 'group', label: 'G', required: true, children: [number('n', { required: true, min: 5 })] },
    ]
    const errors = validateForm(fields, { a: '', n: '2' })
    expect(Object.keys(errors).sort()).toEqual(['a', 'n'])
    expect(errors.n).toMatch(/at least 5/)
    expect(validateForm(fields, { a: 'x', n: '7' })).toEqual({})
  })
})

describe('configWarnings', () => {
  it('flags min > max and empty labels', () => {
    const fields = [number('n', { min: 5, max: 1 }), { ...text('t'), label: '' }]
    const w = configWarnings(fields)
    expect(w.n).toMatch(/min is greater than max/)
    expect(w.t).toMatch(/label is empty/)
  })
})
