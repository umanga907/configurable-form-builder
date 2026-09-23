import { createContext, useContext, useMemo, useReducer } from 'react'
import { builderReducer, initialState } from '../model/reducer.js'

/**
 * State lives in one useReducer. It is exposed through TWO contexts so that
 * components which only dispatch (buttons, editors) never re-render when the
 * tree changes, and components which only read (preview) never re-render
 * because of a new dispatch reference. `dispatch` from useReducer is stable,
 * so the actions object below is created once.
 */
const StateContext = createContext(null)
const ActionsContext = createContext(null)

export function BuilderProvider({ children, initial = initialState }) {
  const [state, dispatch] = useReducer(builderReducer, initial)

  const actions = useMemo(
    () => ({
      addField: (parentId, fieldType) => dispatch({ type: 'ADD_FIELD', parentId, fieldType }),
      updateField: (id, patch) => dispatch({ type: 'UPDATE_FIELD', id, patch }),
      deleteField: (id) => dispatch({ type: 'DELETE_FIELD', id }),
      moveField: (id, direction) => dispatch({ type: 'MOVE_FIELD', id, direction }),
      selectField: (id) => dispatch({ type: 'SELECT_FIELD', id }),
      replaceAll: (fields) => dispatch({ type: 'REPLACE_ALL', fields }),
      reset: () => dispatch({ type: 'RESET' }),
    }),
    [],
  )

  return (
    <ActionsContext.Provider value={actions}>
      <StateContext.Provider value={state}>{children}</StateContext.Provider>
    </ActionsContext.Provider>
  )
}

/** The whole builder state: { fields, selectedId }. */
export function useBuilderState() {
  const ctx = useContext(StateContext)
  if (ctx === null) throw new Error('useBuilderState must be used inside <BuilderProvider>')
  return ctx
}

/** Stable action helpers. Safe to depend on in useCallback/useEffect. */
export function useBuilderActions() {
  const ctx = useContext(ActionsContext)
  if (ctx === null) throw new Error('useBuilderActions must be used inside <BuilderProvider>')
  return ctx
}
