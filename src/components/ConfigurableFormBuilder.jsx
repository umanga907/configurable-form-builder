import { BuilderProvider } from '../state/BuilderContext.jsx'
import { useBuilderState } from '../state/hooks.js'
import { BuilderTree } from './BuilderTree.jsx'
import { FieldEditor } from './FieldEditor.jsx'
import { FormPreview } from './FormPreview.jsx'
import { ConfigPanel } from './ConfigPanel.jsx'
import { flatten } from '../model/tree.js'

/**
 * The component the brief asks for. Drop it anywhere; it owns its own state.
 * Pass `initialFields` to start from an existing configuration.
 */
export function ConfigurableFormBuilder({ initialFields }) {
  const initial = initialFields ? { fields: initialFields, selectedId: null } : undefined
  return (
    <BuilderProvider initial={initial}>
      <Layout />
    </BuilderProvider>
  )
}

function Layout() {
  const { fields } = useBuilderState()
  const total = flatten(fields).length

  return (
    <div className="builder">
      <section className="panel panel-structure" aria-labelledby="h-structure">
        <header className="panel-head">
          <h2 id="h-structure">Structure</h2>
          <span className="meta">{total} {total === 1 ? 'field' : 'fields'}</span>
        </header>
        <BuilderTree />
      </section>

      <section className="panel panel-editor" aria-labelledby="h-editor">
        <header className="panel-head"><h2 id="h-editor">Properties</h2></header>
        <FieldEditor />
      </section>

      <section className="panel panel-preview" aria-labelledby="h-preview">
        <header className="panel-head">
          <h2 id="h-preview">Live preview</h2>
          <span className="meta">updates as you edit</span>
        </header>
        <FormPreview />
      </section>

      <section className="panel panel-config" aria-labelledby="h-config">
        <header className="panel-head"><h2 id="h-config">Configuration</h2></header>
        <ConfigPanel />
      </section>
    </div>
  )
}
