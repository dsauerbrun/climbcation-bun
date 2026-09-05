import type { Client } from '../client.js'
// type only imports, see the note in commands/locations.ts
import type { UnapprovedEdit } from '../../services/admin.service/get-unapproved-edits.js'
import type { AccommodationEdit, FoodOptionsEdit, GettingInEdit, MiscEdit } from '../../services/location.service/location-edit-helpers.js'
import { confirm, formatDate, printJson, table, truncate } from '../output.js'

export const EDIT_TYPES = ['accommodation', 'food_options', 'getting_in', 'misc']

interface AttributeOption {
  id: number
  name: string
}

interface AttributeOptions {
  accommodations?: AttributeOption[]
  foodOptions?: AttributeOption[]
  transportations?: AttributeOption[]
}

const nameFor = (options: AttributeOption[] | undefined, id: number): string =>
  options?.find(option => option.id === id)?.name ?? `id ${id}`

const fetchEdits = async (client: Client): Promise<UnapprovedEdit[]> => {
  const body = await client.get<{ edits?: UnapprovedEdit[] }>('/api/admin/location-edits')
  return body.edits ?? []
}

const findEdit = async (client: Client, editId: number): Promise<UnapprovedEdit | undefined> =>
  (await fetchEdits(client)).find(edit => edit.id === editId)

const notFound = (editId: number): void => {
  console.error(`Edit ${editId} is not in the unapproved queue. It may already be approved, or the id may be wrong.`)
}

const section = (label: string, value: unknown): string =>
  `${label}: ${value === null || value === undefined || value === '' ? '-' : String(value)}`

// the stored edit payloads hold foreign keys, so resolve them against the public
// attribute options. an unknown id renders as "id N" rather than disappearing.
const describeEdit = (edit: UnapprovedEdit, options: AttributeOptions): string[] => {
  const payload = edit.edit as Record<string, unknown>

  if (edit.editType === 'accommodation') {
    const typed = payload as unknown as AccommodationEdit
    return [
      section('closest accommodation', typed.closestAccommodation),
      section('notes', typed.accommodationNotes),
      'accommodations:',
      ...(typed.accommodations ?? []).map(item => `  ${nameFor(options.accommodations, item.id)} — ${item.cost || '-'}`),
    ]
  }

  if (edit.editType === 'food_options') {
    const typed = payload as unknown as FoodOptionsEdit
    return [
      section('common expenses notes', typed.commonExpensesNotes),
      section('saving money tips', typed.savingMoneyTips),
      'food options:',
      ...(typed.foodOptionDetails ?? []).map(item => `  ${nameFor(options.foodOptions, item.id)} — ${item.cost || '-'}`),
    ]
  }

  if (edit.editType === 'getting_in') {
    const typed = payload as unknown as GettingInEdit
    return [
      section('best transportation', `${nameFor(options.transportations, typed.bestTransportationId)} — ${typed.bestTransportationCost || '-'}`),
      section('walking distance', typed.walkingDistance ? 'yes' : 'no'),
      section('notes', typed.gettingInNotes),
      'transportations:',
      ...(typed.transportations ?? []).map(id => `  ${nameFor(options.transportations, id)}`),
    ]
  }

  if (edit.editType === 'misc') {
    const typed = payload as unknown as MiscEdit
    return [
      section('info section', typed.id),
      section('title', typed.title),
      section('body', typed.body),
      ...(!typed.title && !typed.body ? ['', 'note: both title and body are empty, so approving DELETES this info section.'] : []),
    ]
  }

  return [JSON.stringify(payload, null, 2)]
}

export const listEdits = async (client: Client, editType: string | undefined, json: boolean): Promise<void> => {
  const all = await fetchEdits(client)
  const edits = editType ? all.filter(edit => edit.editType === editType) : all

  if (json) {
    printJson(edits)
    return
  }

  if (!edits.length) {
    console.log(editType ? `No unapproved ${editType} edits.` : 'No unapproved edits.')
    return
  }

  console.log(table(
    ['ID', 'LOCATION', 'LOC ID', 'TYPE', 'SUBMITTED'],
    edits.map(edit => [
      edit.id,
      truncate(edit.locationName ?? '-', 34),
      edit.locationId,
      edit.editType,
      formatDate(edit.createdAt),
    ])
  ))
  console.log(`\n${edits.length} unapproved edit${edits.length === 1 ? '' : 's'}`)
}

export const showEdit = async (client: Client, editId: number, json: boolean): Promise<number> => {
  const edit = await findEdit(client, editId)

  if (!edit) {
    notFound(editId)
    return 1
  }

  if (json) {
    printJson(edit)
    return 0
  }

  const options = await client.get<AttributeOptions>('/api/get_attribute_options')

  console.log(`edit ${edit.id} — ${edit.editType}`)
  console.log(`location: ${edit.locationName ?? '-'} (id ${edit.locationId})`)
  console.log(`submitted: ${formatDate(edit.createdAt)}`)
  console.log('')
  console.log(describeEdit(edit, options).join('\n'))
  return 0
}

export const approveEdit = async (client: Client, editId: number, yes: boolean): Promise<number> => {
  const edit = await findEdit(client, editId)

  if (!edit) {
    notFound(editId)
    return 1
  }

  const options = await client.get<AttributeOptions>('/api/get_attribute_options')

  console.log(`edit ${edit.id} — ${edit.editType} on ${edit.locationName ?? '-'} (id ${edit.locationId})`)
  console.log('')
  console.log(describeEdit(edit, options).join('\n'))
  console.log('')
  console.log('Approving writes this to the live location. There is no undo.')

  if (!await confirm(`Approve edit ${edit.id}?`, yes || client.dryRun)) {
    console.log('Aborted.')
    return 1
  }

  // the route needs both ids and the service rejects a mismatched pair, so the
  // location id comes from the queue rather than from anything typed by hand.
  await client.put(`/api/admin/locations/${edit.locationId}/edits/${edit.id}/approve`)
  if (client.dryRun) {
    console.log('[dry-run] nothing was sent.')
    return 0
  }
  console.log(`Approved edit ${edit.id}.`)
  return 0
}
