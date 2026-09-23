import { useMemo, useReducer } from 'react'
import { builderReducer, initialState } from '../model/reducer.js'
import { ActionsContext, StateContext } from './contexts.js'


/**
 * State lives in one useReducer. `dispatch` is stable, so the actions object
 * below is created once and never causes a re-render on its own.
 */
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
