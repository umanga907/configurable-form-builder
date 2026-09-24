import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { ConfigurableFormBuilder } from './ConfigurableFormBuilder.jsx'

describe('<ConfigurableFormBuilder />', () => {
  it('starts empty and adds a text field that appears in the preview', () => {
    render(<ConfigurableFormBuilder />)
    expect(screen.getByText(/No fields yet/)).toBeInTheDocument()

    const addToForm = screen.getByRole('group', { name: 'Add to form' })
    fireEvent.click(within(addToForm).getByRole('button', { name: '+ text' }))

    // Editor opened for the new field; rename it.
    const label = screen.getByLabelText('Label')
    fireEvent.change(label, { target: { value: 'Email' } })

    // Preview shows a real input with that label.
    const preview = screen.getByRole('region', { name: 'Live preview' })
    expect(within(preview).getByLabelText(/Email/)).toBeInTheDocument()
  })

  it('nests a number field inside a group and validates it in the preview', () => {
    render(<ConfigurableFormBuilder />)
    fireEvent.click(within(screen.getByRole('group', { name: 'Add to form' })).getByRole('button', { name: '+ group' }))
    fireEvent.change(screen.getByLabelText('Label'), { target: { value: 'Driver' } })

    fireEvent.click(within(screen.getByRole('group', { name: 'Add to Driver' })).getByRole('button', { name: '+ number' }))
    fireEvent.change(screen.getByLabelText('Label'), { target: { value: 'Age' } })
    fireEvent.click(screen.getByLabelText('Required'))
    fireEvent.change(screen.getByLabelText('Min'), { target: { value: '18' } })

    const preview = screen.getByRole('region', { name: 'Live preview' })
    const group = within(preview).getByRole('group', { name: 'Driver' }) // fieldset/legend
    const age = within(group).getByLabelText(/Age/)

    fireEvent.change(age, { target: { value: 'abc' } })
    fireEvent.blur(age)
    expect(within(preview).getByRole('alert')).toHaveTextContent('Enter a valid number.')

    fireEvent.change(age, { target: { value: '12' } })
    expect(within(preview).getByRole('alert')).toHaveTextContent('Must be at least 18.')

    fireEvent.change(age, { target: { value: '30' } })
    expect(within(preview).queryByRole('alert')).toBeNull()
  })

  it('reports required fields on submit and clears when filled', () => {
    render(<ConfigurableFormBuilder />)
    fireEvent.click(within(screen.getByRole('group', { name: 'Add to form' })).getByRole('button', { name: '+ text' }))
    fireEvent.click(screen.getByLabelText('Required'))

    const preview = screen.getByRole('region', { name: 'Live preview' })
    fireEvent.click(within(preview).getByRole('button', { name: 'Submit' }))
    expect(within(preview).getByRole('status')).toHaveTextContent('1 field needs attention.')

    fireEvent.change(within(preview).getByRole('textbox'), { target: { value: 'hello' } })
    fireEvent.click(within(preview).getByRole('button', { name: 'Submit' }))
    expect(within(preview).getByRole('status')).toHaveTextContent('Valid.')
  })

  it('deletes a group and everything inside it, clearing the editor', () => {
    render(<ConfigurableFormBuilder />)
    fireEvent.click(within(screen.getByRole('group', { name: 'Add to form' })).getByRole('button', { name: '+ group' }))
    fireEvent.click(within(screen.getByRole('group', { name: 'Add to Group' })).getByRole('button', { name: '+ text' }))
    expect(screen.getByText('2 fields')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Delete Group' }))
    expect(screen.getByText('0 fields')).toBeInTheDocument()
    expect(screen.getByText(/Select a field in the structure/)).toBeInTheDocument()
  })

  it('exports JSON and re-imports it', () => {
    render(<ConfigurableFormBuilder />)
    fireEvent.click(within(screen.getByRole('group', { name: 'Add to form' })).getByRole('button', { name: '+ number' }))
    fireEvent.change(screen.getByLabelText('Label'), { target: { value: 'Qty' } })

    fireEvent.click(screen.getByRole('button', { name: 'Export JSON' }))
    const exported = screen.getByLabelText('Exported configuration').value
    expect(JSON.parse(exported)).toMatchObject({ version: 1, fields: [{ type: 'number', label: 'Qty' }] })

    // Import a different config; confirm() is stubbed to accept.
    window.confirm = () => true
    fireEvent.change(screen.getByLabelText('Configuration to import'), {
      target: { value: '[{"type":"text","label":"Only one"}]' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Import JSON' }))
    expect(screen.getByRole('status')).toHaveTextContent('Imported 1 top-level field.')
    expect(screen.getByRole('region', { name: 'Live preview' })).toHaveTextContent('Only one')
  })

  it('refuses a broken import and explains where the problem is', () => {
    render(<ConfigurableFormBuilder />)
    fireEvent.change(screen.getByLabelText('Configuration to import'), {
      target: { value: '{"fields":[{"id":"a","type":"group","children":[{"id":"b","type":"number","min":"x"}]}]}' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Import JSON' }))
    expect(screen.getByRole('alert')).toHaveTextContent('fields[0].children[0].min must be a number')
    expect(screen.getByText(/No fields yet/)).toBeInTheDocument()
  })
})
