import { createContext } from 'react'

/**
 * Two contexts on purpose: components that only dispatch (buttons, editor)
 * never re-render when the tree changes, and components that only read
 * (preview) never re-render because of a new actions reference.
 */
export const StateContext = createContext(null)
export const ActionsContext = createContext(null)
