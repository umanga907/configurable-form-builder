import { useState } from 'react'
import { useBuilderActions, useBuilderState } from '../state/hooks.js'
import { exportConfig, parseConfig } from '../model/config-io.js'
import { SAMPLE_FIELDS } from '../model/sample.js'

/**
 * Export shows the current configuration as JSON and copies it. Import takes
 * pasted JSON, checks it, and either replaces the tree or shows the first
 * problem with its path. Nothing is applied when something is wrong.
 */
export function ConfigPanel() {
  const { fields } = useBuilderState()
  const { replaceAll, reset } = useBuilderActions()

  const [exported, setExported] = useState('')
  const [copied, setCopied] = useState(false)
  const [importText, setImportText] = useState('')
  const [result, setResult] = useState(null) // null | ImportResult

  const onExport = () => {
    setExported(exportConfig(fields))
    setCopied(false)
  }

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(exported)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  const onImport = () => {
    const parsed = parseConfig(importText)
    setResult(parsed)
    if (!parsed.ok) return
    if (fields.length > 0 && !window.confirm('Replace the current form with the imported one?')) return
    replaceAll(parsed.fields)
  }

  const onLoadSample = () => {
    if (fields.length > 0 && !window.confirm('Replace the current form with the sample?')) return
    replaceAll(SAMPLE_FIELDS)
    setResult(null)
  }

  const onClear = () => {
    if (fields.length > 0 && !window.confirm('Remove all fields?')) return
    reset()
    setExported('')
    setResult(null)
  }

  return (
    <div className="config">
      <section className="config-col">
        <div className="config-head">
          <h3>Export</h3>
          <div className="btn-row">
            <button type="button" className="primary" onClick={onExport} disabled={fields.length === 0}>Export JSON</button>
            <button type="button" onClick={onCopy} disabled={!exported}>{copied ? 'Copied' : 'Copy'}</button>
          </div>
        </div>
        <textarea
          className="json"
          readOnly
          value={exported}
          placeholder="Click Export JSON to see the current configuration here."
          aria-label="Exported configuration"
          spellCheck={false}
        />
      </section>

      <section className="config-col">
        <div className="config-head">
          <h3>Import</h3>
          <div className="btn-row">
            <button type="button" className="primary" onClick={onImport} disabled={importText.trim() === ''}>Import JSON</button>
            <button type="button" onClick={onLoadSample}>Load sample</button>
            <button type="button" className="danger" onClick={onClear} disabled={fields.length === 0}>Clear form</button>
          </div>
        </div>
        <textarea
          className="json"
          value={importText}
          onChange={(e) => { setImportText(e.target.value); setResult(null) }}
          placeholder='Paste a configuration: { "version": 1, "fields": [ ... ] }'
          aria-label="Configuration to import"
          spellCheck={false}
        />
        {result && !result.ok && (
          <p className="import-result err" role="alert">
            <strong>Nothing was imported.</strong> <code>{result.error}</code>
          </p>
        )}
        {result && result.ok && (
          <p className="import-result ok" role="status">
            Imported {result.fields.length} top-level {result.fields.length === 1 ? 'field' : 'fields'}.
          </p>
        )}
      </section>
    </div>
  )
}
