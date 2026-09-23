import { memo } from 'react'
import { useBuilderActions, useBuilderState } from '../state/hooks.js'
import { FIELD_TYPES, isGroup } from '../model/types.js'

/**
 * The structure panel. Renders the tree recursively; each node shows its
 * type, label, and the move / delete controls. Selecting a node opens it in
 * the editor. Groups get their own "add" row so children land in the right
 * place.
 */
export function BuilderTree() {
  const { fields, selectedId } = useBuilderState()

  return (
    <div className="tree">
      {fields.length === 0 ? (
        <p className="empty">No fields yet. Add one below to start building.</p>
      ) : (
        <FieldList fields={fields} selectedId={selectedId} depth={0} />
      )}
      <AddRow parentId={null} label="Add to form" />
    </div>
  )
}

/** Renders one level of the tree. Memoised so untouched groups do not re-render. */
const FieldList = memo(function FieldList({ fields, selectedId, depth }) {
  return (
    <ul className="tree-list" role="list">
      {fields.map((field, index) => (
        <FieldNode
          key={field.id}
          field={field}
          index={index}
          count={fields.length}
          depth={depth}
          isSelected={field.id === selectedId}
          // Only groups need the selection to render their children.
          selectedId={isGroup(field) ? selectedId : null}
        />
      ))}
    </ul>
  )
})

const FieldNode = memo(function FieldNode({ field, index, count, depth, isSelected, selectedId }) {
  const { selectField, deleteField, moveField } = useBuilderActions()
  const group = isGroup(field)

  return (
    <li className={`tree-node${isSelected ? ' is-selected' : ''}`} style={{ '--depth': depth }}>
      <div className="tree-row">
        <button
          type="button"
          className="tree-label"
          onClick={() => selectField(field.id)}
          aria-pressed={isSelected}
          aria-label={`Edit ${field.label || 'untitled field'}`}
        >
          <span className={`type-badge type-${field.type}`}>{field.type}</span>
          <span className="label-text">{field.label || <em>untitled</em>}</span>
          {field.required && <span className="req-dot" title="Required">*</span>}
          {field.type === 'number' && (field.min !== undefined || field.max !== undefined) && (
            <span className="meta">
              {field.min !== undefined ? field.min : '…'} to {field.max !== undefined ? field.max : '…'}
            </span>
          )}
          {group && <span className="meta">{field.children.length} {field.children.length === 1 ? 'field' : 'fields'}</span>}
        </button>
        <div className="tree-actions">
          <button type="button" onClick={() => moveField(field.id, 'up')} disabled={index === 0} aria-label={`Move ${field.label} up`} title="Move up">↑</button>
          <button type="button" onClick={() => moveField(field.id, 'down')} disabled={index === count - 1} aria-label={`Move ${field.label} down`} title="Move down">↓</button>
          <button type="button" className="danger" onClick={() => deleteField(field.id)} aria-label={`Delete ${field.label}`} title="Delete">✕</button>
        </div>
      </div>

      {group && (
        <div className="tree-children">
          {field.children.length > 0 && <FieldList fields={field.children} selectedId={selectedId} depth={depth + 1} />}
          <AddRow parentId={field.id} label={`Add to ${field.label || 'group'}`} />
        </div>
      )}
    </li>
  )
})

function AddRow({ parentId, label }) {
  const { addField } = useBuilderActions()
  return (
    <div className="add-row" role="group" aria-label={label}>
      <span className="add-label">{label}:</span>
      {FIELD_TYPES.map((type) => (
        <button key={type} type="button" className="add-btn" onClick={() => addField(parentId, type)}>
          + {type}
        </button>
      ))}
    </div>
  )
}
