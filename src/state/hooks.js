import { useContext } from 'react'
import { ActionsContext, StateContext } from './contexts.js'

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
