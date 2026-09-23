# Configurable Form Builder

A React component that lets a user build a form: add text, number and group fields, nest groups inside groups, edit each field's properties, see the real form update live with validation, and export or import the whole configuration as JSON.

Built for the CloudFactory Senior Frontend Engineer assessment, September 2026.

- React 19, plain JavaScript, Vite.
- No state management library, no form library, no UI framework. Plain CSS.
- State: one `useReducer`, shared through Context.
- 37 unit tests on the model plus component tests, with Vitest and Testing Library.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # unit + component tests
npm run build      # production build in dist/
```

The app opens with a small sample form loaded so nothing is empty on first look. **Clear form** removes it.

## How it is put together

```
src/
  model/            pure functions, no React
    types.js        the field shapes (JSDoc)
    tree.js         recursive, immutable operations on the field tree
    reducer.js      builder state + actions
    validation.js   value validation for the preview
    config-io.js    export to JSON, import with structural validation
    sample.js       the sample configuration
  state/
    BuilderContext.jsx   useReducer + two contexts (state, actions)
  components/
    ConfigurableFormBuilder.jsx   the component the brief asks for
    BuilderTree.jsx               structure panel (recursive)
    FieldEditor.jsx               properties of the selected field
    FormPreview.jsx               the live form (recursive)
    ConfigPanel.jsx               export / import
  styles.css        tokens, layout, components
```

### The data

The configuration is a tree. A group is a field whose `children` is an array of fields, so nesting is recursive by construction and there is no separate "group" concept to keep in sync.

```json
{
  "version": 1,
  "fields": [
    { "id": "name", "type": "text", "label": "Full name", "required": true },
    { "id": "shipment", "type": "group", "label": "Shipment", "required": false, "children": [
      { "id": "weight", "type": "number", "label": "Weight (kg)", "required": true, "min": 0, "max": 30000 }
    ] }
  ]
}
```

Every field has a stable `id`. The builder addresses fields by id, never by array index, so moving or nesting a field never breaks a reference.

### The tree functions (`model/tree.js`)

`findField`, `findParentId`, `insertField`, `updateField`, `removeField`, `moveField`, `siblingPosition`, `flatten`. All recursive, all immutable. Two rules they follow:

1. They return a **new array only for the branch that changed** and keep the same reference for everything else. Untouched groups keep their identity, so `React.memo` on the tree nodes and preview groups can skip them.
2. They return the **same array reference when nothing changed** (moving the first item up, deleting an id that does not exist). The reducer checks that and returns the same state, so React bails out of the render entirely.

This is where the "recursive data structures" part of the brief lives, and it is the part with the most tests.

### State (`model/reducer.js`, `state/BuilderContext.jsx`)

One reducer, seven actions: `ADD_FIELD`, `UPDATE_FIELD`, `DELETE_FIELD`, `MOVE_FIELD`, `SELECT_FIELD`, `REPLACE_ALL`, `RESET`. State is `{ fields, selectedId }`. Deleting a group that contains the selected field clears the selection.

The provider exposes **two contexts**: one for state and one for the action helpers. `dispatch` from `useReducer` is stable, so the actions object is created once. Buttons and the editor only read the actions context and do not re-render when the tree changes; the preview only reads state.

### The preview (`components/FormPreview.jsx`)

Renders real inputs from the same tree. Values are kept as the raw strings the user typed, keyed by field id. Validation runs live for fields the user has touched, and for every field on submit.

Number fields are `<input type="text" inputMode="decimal">` rather than `type="number"`. The browser's number input silently drops letters in some browsers and reports an empty value, which is the opposite of "behaves predictably". With a text input the user sees exactly what they typed and gets "Enter a valid number." next to it. `parseNumber` accepts plain decimals only, so `1e5`, `0x10` and `12abc` are all rejected the same way.

### Import (`model/config-io.js`)

Pasted JSON is validated field by field. Problems are collected with a path, `fields[0].children[1].min: expected a number`, and if there is a single error nothing is imported. Missing ids, duplicate ids and missing labels are repaired and reported as warnings instead of failing, because a hand-edited config should not be rejected for a missing id. Both `{ "version": 1, "fields": [...] }` and a bare array are accepted. Nesting is capped at 32 levels.

## Decisions worth mentioning

- **Move up / move down instead of drag and drop.** The brief allows it, and it keeps the reorder logic a pure function with tests. Drag and drop would be a UI layer on top of the same `moveField`.
- **The editor is keyed by field id.** Selecting a different field remounts the editor, so uncontrolled min/max inputs start from the new field's values without extra effects.
- **Groups have `required` in the data** because the brief lists it as a common property, but the preview validates leaves only. The editor says so when a group is selected.
- **Sample data on load**, with a one-click Load sample and Clear form. Reviewers should not have to build a form before they can judge the preview.
- **Accessibility basics**: real `<label for>`, `<fieldset>` and `<legend>` for groups, `aria-invalid` and `aria-describedby` on errors, `role="alert"` on error messages, keyboard-reachable buttons with labels that say which field they act on.

## What I would do next

- Drag and drop reorder across groups, on top of the existing `moveField` / `insertField`.
- Change a field's type in place (currently delete and add).
- More field types (select, boolean, date) by extending `FIELD_TYPES`, `createField`, `validateValue` and `PreviewField`.
- Persist the configuration to `localStorage` so a refresh does not lose work.
- Undo / redo, which the reducer shape makes cheap: keep a stack of past states.

## Tests

```bash
npm test
```

`model/*.test.js` cover the tree functions (including the same-reference guarantees), the reducer, validation and import/export. `components/*.test.jsx` render the builder and check that structure changes show up in the preview and that validation messages appear.
