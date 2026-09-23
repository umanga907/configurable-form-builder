import { ConfigurableFormBuilder } from './components/ConfigurableFormBuilder.jsx'
import { SAMPLE_FIELDS } from './model/sample.js'

export default function App() {
  return (
    <>
      <header className="app-head">
        <h1>Configurable Form Builder</h1>
        <p>Add text, number and group fields, nest groups, edit properties, and watch the form update live. Export or import the whole thing as JSON.</p>
      </header>
      <main>
        <ConfigurableFormBuilder initialFields={SAMPLE_FIELDS} />
      </main>
    </>
  )
}
