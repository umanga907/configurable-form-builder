import { useBuilderActions, useBuilderState } from '../state/BuilderContext.jsx'
import { findField, siblingPosition } from '../model/tree.js'
import { parseNumber } from '../model/validation.js'

/**
 * Property editor for the selected field. Common properties first, then the
 * type-specific ones. Every change is dispatched immediately so the preview
 * updates as you type.
 */
export function FieldEditor() {
  const { fields, selectedId } = useBuilderState()
  const { updateField, deleteField, moveField } = useBuilderActions()

  const field = selectedId ? findField(fields, selectedId) : null
  if (!field) {
    return (
      <div className="editor">
        <p className="empty">Select a field in the structure to edit its properties.</p>
      </div>
    )
  }

  const pos = siblingPosition(fields, field.id)
  const onNumberProp = (key) => (e) => {
    const raw = e.target.value
    // Empty clears the constraint; anything else must parse as a number.
    if (raw.trim() === '') {
      updateField(field.id, { [key]: undefined })
      return
    }
    const n = parseNumber(raw)
    if (n !== null) updateField(field.id, { [key]: n })
  }
  const minMaxConflict = field.type === 'number' && field.min !== undefined && field.max !== undefined && field.min > field.max

  return (
    <div className="editor" key={field.id}>
      <div className="editor-head">
        <span className={`type-badge type-${field.type}`}>{field.type}</span>
        <code className="field-id" title="Field id">{field.id}</code>
      </div>

      <label className="prop">
        <span>Label</span>
        <input
          type="text"
          value={field.label}
          onChange={(e) => updateField(field.id, { label: e.target.value })}
          placeholder="What the user sees"
          autoFocus
        />
      </label>

      <label className="prop prop-inline">
        <input
          type="checkbox"
          checked={field.required}
          onChange={(e) => updateField(field.id, { required: e.target.checked })}
        />
        <span>Required</span>
      </label>

      {field.type === 'number' && (
        <fieldset className="prop-group">
          <legend>Number constraints (optional)</legend>
          <div className="prop-pair">
            <label className="prop">
              <span>Min</span>
              <input type="text" inputMode="decimal" defaultValue={field.min ?? ''} onChange={onNumberProp('min')} placeholder="none" />
            </label>
            <label className="prop">
              <span>Max</span>
              <input type="text" inputMode="decimal" defaultValue={field.max ?? ''} onChange={onNumberProp('max')} placeholder="none" />
            </label>
          </div>
          {minMaxConflict && <p className="warn">Min is greater than max. The preview will reject every value.</p>}
        </fieldset>
      )}

      {field.type === 'group' && (
        <p className="hint">
          This group holds {field.children.length} {field.children.length === 1 ? 'field' : 'fields'}. Add children from the structure panel. Marking a group required has no effect on its own; mark the fields inside it.
        </p>
      )}

      <div className="editor-actions">
        <button type="button" onClick={() => moveField(field.id, 'up')} disabled={!pos || pos.index === 0}>Move up</button>
        <button type="button" onClick={() => moveField(field.id, 'down')} disabled={!pos || pos.index === pos.count - 1}>Move down</button>
        <button type="button" className="danger" onClick={() => deleteField(field.id)}>Delete</button>
      </div>
    </div>
  )
}
