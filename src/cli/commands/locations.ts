import { existsSync, readFileSync, statSync } from 'node:fs'
import { basename, extname } from 'node:path'
import type { Client } from '../client.js'
// type only import. the service module builds a pg pool the moment it loads, and
// the cli must never open a database connection, so this has to stay erasable.
import type { AdminLocation } from '../../services/admin.service/get-locations.js'
import { confirm, formatDate, printJson, table, truncate } from '../output.js'

const MIME_BY_EXTENSION: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
}

// matches the multer limit in admin.controller.ts. checked here so an oversized
// file fails with a clear message instead of a generic upload error.
const MAX_IMAGE_BYTES = 5 * 1024 * 1024

export interface LocationFields {
  name?: string
  slug?: string
  continent?: string
  country?: string
  airportCode?: string
  rating?: number
  soloFriendly?: boolean
  latitude?: number
  longitude?: number
}

const fetchLocations = async (client: Client, active?: boolean): Promise<AdminLocation[]> => {
  const query = active === undefined ? '' : `?active=${active}`
  const body = await client.get<{ locations?: AdminLocation[] }>(`/api/admin/locations${query}`)
  return body.locations ?? []
}

// resolved against the unfiltered list so a bad id fails here rather than at the
// server. that matters most for the image upload, which puts the file in s3
// before it touches the database and would otherwise orphan an object.
const requireLocation = async (client: Client, locationId: number): Promise<AdminLocation | null> => {
  const locations = await fetchLocations(client)
  const location = locations.find(candidate => candidate.id === locationId)

  if (!location) {
    console.error(`No location with id ${locationId}.`)
    return null
  }

  return location
}

const describe = (location: AdminLocation): string =>
  `${location.name ?? '(unnamed)'} (id ${location.id})`

export const listLocations = async (client: Client, active: boolean | undefined, json: boolean): Promise<void> => {
  const locations = await fetchLocations(client, active)

  if (json) {
    printJson(locations)
    return
  }

  if (!locations.length) {
    console.log('No locations matched.')
    return
  }

  console.log(table(
    ['ID', 'NAME', 'COUNTRY', 'ACTIVE', 'RATING', 'SUBMITTER', 'CREATED'],
    locations.map(location => [
      location.id,
      truncate(location.name ?? '-', 34),
      truncate(location.country ?? '-', 18),
      location.active,
      location.rating,
      truncate(location.submitterEmail ?? '-', 28),
      formatDate(location.createdAt),
    ])
  ))
  console.log(`\n${locations.length} location${locations.length === 1 ? '' : 's'}`)
}

export const approveLocation = async (client: Client, locationId: number, yes: boolean): Promise<number> => {
  const location = await requireLocation(client, locationId)
  if (!location) return 1

  if (location.active) {
    console.log(`${describe(location)} is already active. Nothing to do.`)
    return 0
  }

  // printed rather than folded into the prompt so --yes and --dry-run runs still
  // say which location is about to go public.
  console.log(table(
    ['NAME', 'COUNTRY', 'CONTINENT', 'RATING', 'SUBMITTER', 'CREATED'],
    [[location.name, location.country, location.continent, location.rating, location.submitterEmail, formatDate(location.createdAt)]]
  ))
  console.log('')

  if (!await confirm(`Approve ${describe(location)} and make it publicly visible?`, yes || client.dryRun)) {
    console.log('Aborted.')
    return 1
  }

  await client.put(`/api/admin/locations/${locationId}/approve`)
  if (client.dryRun) {
    console.log('[dry-run] nothing was sent.')
    return 0
  }
  console.log(`Approved ${describe(location)}.`)
  return 0
}

export const updateLocation = async (client: Client, locationId: number, fields: LocationFields, yes: boolean): Promise<number> => {
  const entries = Object.entries(fields).filter(([, value]) => value !== undefined)

  if (!entries.length) {
    console.error('Nothing to update. Pass at least one field, e.g. --rating 4 or --country Spain.')
    return 1
  }

  const location = await requireLocation(client, locationId)
  if (!location) return 1

  const summary = entries.map(([key, value]) => `  ${key} -> ${String(value)}`).join('\n')

  console.log(`Updating ${describe(location)}:`)
  console.log(summary)

  if (!await confirm('Apply these changes?', yes || client.dryRun)) {
    console.log('Aborted.')
    return 1
  }

  await client.put(`/api/admin/locations/${locationId}`, Object.fromEntries(entries))
  if (client.dryRun) {
    console.log('[dry-run] nothing was sent.')
    return 0
  }
  console.log(`Updated ${describe(location)}.`)
  return 0
}

export const uploadLocationImage = async (client: Client, locationId: number, imagePath: string, yes: boolean): Promise<number> => {
  if (!existsSync(imagePath)) {
    console.error(`No such file: ${imagePath}`)
    return 1
  }

  const extension = extname(imagePath).toLowerCase()
  const contentType = MIME_BY_EXTENSION[extension]

  if (!contentType) {
    console.error(`Unsupported image type "${extension || '(none)'}". The server accepts ${Object.keys(MIME_BY_EXTENSION).join(', ')}.`)
    return 1
  }

  const size = statSync(imagePath).size
  if (size > MAX_IMAGE_BYTES) {
    console.error(`${imagePath} is ${(size / 1024 / 1024).toFixed(1)}MB. The server rejects anything over 5MB.`)
    return 1
  }

  const location = await requireLocation(client, locationId)
  if (!location) return 1

  if (!await confirm(`Replace the thumbnail for ${describe(location)} with ${basename(imagePath)}?`, yes || client.dryRun)) {
    console.log('Aborted.')
    return 1
  }

  const form = new FormData()
  form.append('image', new Blob([readFileSync(imagePath)], { type: contentType }), basename(imagePath))

  const { url } = await client.postForm<{ url?: string }>(`/api/admin/locations/${locationId}/image`, form)
  if (client.dryRun) {
    console.log('[dry-run] nothing was sent.')
    return 0
  }
  console.log(`Uploaded ${basename(imagePath)} for ${describe(location)}.`)
  if (url) console.log(url)
  return 0
}
