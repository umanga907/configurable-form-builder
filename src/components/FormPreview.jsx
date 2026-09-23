import { memo, useCallback, useMemo, useState } from 'react'
import { useBuilderState } from '../state/BuilderContext.jsx'
import { isGroup } from '../model/types.js'
import { validateForm, validateValue } from '../model/validation.js'

/**
 * The live preview renders a real, working form from the same tree the
 * builder edits, so any structural change shows up immediately.
 *
 * Values are kept as raw strings keyed by field id. Validation runs on the
 * fly for fields the user has touched, and for everything on submit. Number
 * inputs are plain text inputs with a decimal keyboard: the browser's own
 * <input type="number"> silently drops letters in some browsers and reports
 * an empty value, which is the opposite of "behaves predictably". Here the
 * user sees exactly what they typed and a clear message next to it.
 */
export function FormPreview() {
  const { fields } = useBuilderState()
  const [values, setValues] = useState({})
  const [touched, setTouched] = useState({})
  const [submitted, setSubmitted] = useState(null) // null | { ok: boolean }

  const setValue = useCallback((id, value) => {
    setValues((prev) => ({ ...prev, [id]: value }))
    setSubmitted(null)
  }, [])
  const markTouched = useCallback((id) => setTouched((prev) => (prev[id] ? prev : { ...prev, [id]: true })), [])

  const errors = useMemo(() => validateForm(fields, values), [fields, values])
  const errorCount = Object.keys(errors).length

  const onSubmit = (e) => {
    e.preventDefault()
    // Touch everything so every error is visible, then report.
    const all = {}
    const walk = (list) => list.forEach((f) => (isGroup(f) ? walk(f.children) : (all[f.id] = true)))
    walk(fields)
    setTouched(all)
    setSubmitted({ ok: errorCount === 0 })
  }

  const onReset = () => {
    setValues({})
    setTouched({})
    setSubmitted(null)
  }

  if (fields.length === 0) {
    return <p className="empty">The form is empty. Add fields on the left and they appear here.</p>
  }

  return (
    <form className="preview-form" onSubmit={onSubmit} onReset={onReset} noValidate>
      <FieldGroup fields={fields} values={values} touched={touched} onChange={setValue} onBlur={markTouched} />
      <div className="preview-actions">
        <button type="submit" className="primary">Submit</button>
        <button type="reset">Reset values</button>
        {submitted && (
          <span role="status" className={submitted.ok ? 'ok' : 'err'}>
            {submitted.ok ? 'Valid. This would submit.' : `${errorCount} ${errorCount === 1 ? 'field needs' : 'fields need'} attention.`}
          </span>
        )}
      </div>
    </form>
  )
}

const FieldGroup = memo(function FieldGroup({ fields, values, touched, onChange, onBlur }) {
  return fields.map((field) =>
    isGroup(field) ? (
      <fieldset key={field.id} className="preview-group">
        <legend>{field.label || <em>untitled group</em>}</legend>
        {field.children.length === 0 ? (
          <p className="empty small">Empty group</p>
        ) : (
          <FieldGroup fields={field.children} values={values} touched={touched} onChange={onChange} onBlur={onBlur} />
        )}
      </fieldset>
    ) : (
      <PreviewField
        key={field.id}
        field={field}
        value={values[field.id] ?? ''}
        showError={Boolean(touched[field.id])}
        onChange={onChange}
        onBlur={onBlur}
      />
    ),
  )
})

const PreviewField = memo(function PreviewField({ field, value, showError, onChange, onBlur }) {
  const error = showError ? validateValue(field, value) : null
  const inputId = `pv-${field.id}`
  const errorId = `${inputId}-err`
  const isNumber = field.type === 'number'

  const hint = isNumber && (field.min !== undefined || field.max !== undefined)
    ? `${field.min !== undefined ? `min ${field.min}` : ''}${field.min !== undefined && field.max !== undefined ? ', ' : ''}${field.max !== undefined ? `max ${field.max}` : ''}`
    : null

  return (
    <div className={`preview-field${error ? ' has-error' : ''}`}>
      <label htmlFor={inputId}>
        {field.label || <em>untitled</em>}
        {field.required && <span className="req-dot" aria-hidden="true">*</span>}
        {hint && <span className="meta">{hint}</span>}
      </label>
      <input
        id={inputId}
        type="text"
        inputMode={isNumber ? 'decimal' : 'text'}
        value={value}
        onChange={(e) => onChange(field.id, e.target.value)}
        onBlur={() => onBlur(field.id)}
        aria-required={field.required || undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        placeholder={isNumber ? 'Enter a number' : ''}
      />
      {error && <p id={errorId} className="field-error" role="alert">{error}</p>}
    </div>
  )
})
