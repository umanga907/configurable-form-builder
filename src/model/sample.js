/**
 * A small configuration reviewers can load with one click, so the builder,
 * preview and export are never empty on first open.
 * @type {import('./types.js').Field[]}
 */
export const SAMPLE_FIELDS = [
  { id: 'full-name', type: 'text', label: 'Full name', required: true },
  {
    id: 'shipment',
    type: 'group',
    label: 'Shipment',
    required: false,
    children: [
      { id: 'container', type: 'text', label: 'Container number', required: true },
      { id: 'weight', type: 'number', label: 'Weight (kg)', required: true, min: 0, max: 30000 },
      {
        id: 'pickup',
        type: 'group',
        label: 'Pickup',
        required: false,
        children: [
          { id: 'terminal', type: 'text', label: 'Terminal', required: false },
          { id: 'appointment', type: 'number', label: 'Appointment slot (0-23)', required: false, min: 0, max: 23 },
        ],
      },
    ],
  },
  { id: 'notes', type: 'text', label: 'Notes', required: false },
]
