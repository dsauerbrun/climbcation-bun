#!/usr/bin/env bun
import { parseArgs } from 'node:util'
import { ApiError, createClient } from './client.js'
import { ConfigError, loadProfile } from './config.js'
import * as edits from './commands/edits.js'
import * as locations from './commands/locations.js'

class UsageError extends Error {}

const HELP = `climbcation-admin — administer a Climbcation server over its admin API

usage
  climbcation-admin <group> <command> [arguments] [flags]

edits
  list [--type <type>]            unapproved location edits (${edits.EDIT_TYPES.join(', ')})
  show <editId>                   the full contents of one queued edit
  approve <editId>                apply a queued edit to the live location

locations
  list [--pending | --active]     locations, optionally filtered by approval state
  approve <locationId>            make a submitted location publicly visible
  update <locationId> [fields]    edit location fields directly
  image <locationId> <path>       replace the location thumbnail

update fields
  --name --slug --continent --country --airport-code
  --rating --latitude --longitude
  --solo-friendly | --no-solo-friendly

global flags
  --profile <name>   profile from ~/.climbcation-admin.json (default: defaultProfile, else "local")
  --json             print raw json instead of a table
  --yes, -y          skip confirmation prompts
  --dry-run          print the request that would be sent, then stop
  --help, -h         this message

examples
  climbcation-admin locations list --pending
  climbcation-admin edits show 472
  climbcation-admin edits approve 472
  climbcation-admin --profile prod locations update 174 --rating 4 --country Spain`

// one combined spec so global flags work in any position, including before the
// subcommand. each command then declares which of these it actually accepts.
const OPTIONS = {
  profile: { type: 'string' as const },
  json: { type: 'boolean' as const },
  yes: { type: 'boolean' as const, short: 'y' },
  'dry-run': { type: 'boolean' as const },
  help: { type: 'boolean' as const, short: 'h' },
  type: { type: 'string' as const },
  pending: { type: 'boolean' as const },
  active: { type: 'boolean' as const },
  name: { type: 'string' as const },
  slug: { type: 'string' as const },
  continent: { type: 'string' as const },
  country: { type: 'string' as const },
  'airport-code': { type: 'string' as const },
  rating: { type: 'string' as const },
  latitude: { type: 'string' as const },
  longitude: { type: 'string' as const },
  'solo-friendly': { type: 'boolean' as const },
  'no-solo-friendly': { type: 'boolean' as const },
}

const GLOBAL_FLAGS = ['profile', 'dry-run', 'help']

const ALLOWED: Record<string, string[]> = {
  'edits list': ['json', 'type'],
  'edits show': ['json'],
  'edits approve': ['yes'],
  'locations list': ['json', 'pending', 'active'],
  'locations approve': ['yes'],
  'locations update': ['yes', 'name', 'slug', 'continent', 'country', 'airport-code', 'rating', 'latitude', 'longitude', 'solo-friendly', 'no-solo-friendly'],
  'locations image': ['yes'],
}

type Values = Record<string, string | boolean | undefined>

const rejectUnsupportedFlags = (command: string, values: Values): void => {
  const allowed = [...(ALLOWED[command] ?? []), ...GLOBAL_FLAGS]
  const used = Object.keys(values).filter(key => values[key] !== undefined)
  const bad = used.filter(key => !allowed.includes(key))

  if (bad.length) {
    throw new UsageError(`${bad.map(flag => `--${flag}`).join(', ')} ${bad.length === 1 ? 'is' : 'are'} not valid for "${command}".`)
  }
}

const requireId = (label: string, raw: string | undefined): number => {
  if (raw === undefined) throw new UsageError(`Missing <${label}>.`)
  const value = Number(raw)
  if (!Number.isInteger(value) || value <= 0) throw new UsageError(`<${label}> must be a positive integer, got "${raw}".`)
  return value
}

const optionalNumber = (flag: string, raw: string | undefined): number | undefined => {
  if (raw === undefined) return undefined
  const value = Number(raw)
  if (!Number.isFinite(value)) throw new UsageError(`--${flag} must be a number, got "${raw}".`)
  return value
}

const soloFriendlyFrom = (values: Values): boolean | undefined => {
  if (values['solo-friendly'] && values['no-solo-friendly']) {
    throw new UsageError('--solo-friendly and --no-solo-friendly cannot be used together.')
  }
  if (values['solo-friendly']) return true
  if (values['no-solo-friendly']) return false
  return undefined
}

const activeFilterFrom = (values: Values): boolean | undefined => {
  if (values.pending && values.active) {
    throw new UsageError('--pending and --active cannot be used together.')
  }
  if (values.pending) return false
  if (values.active) return true
  return undefined
}

const main = async (): Promise<number> => {
  const { values, positionals } = parseArgs({
    args: process.argv.slice(2),
    options: OPTIONS,
    allowPositionals: true,
    strict: true,
  })

  const [group, action, ...rest] = positionals

  if (values.help || !group || group === 'help') {
    console.log(HELP)
    return 0
  }

  if (!action) throw new UsageError(`"${group}" needs a command. Run --help for the list.`)

  const command = `${group} ${action}`
  if (!(command in ALLOWED)) throw new UsageError(`Unknown command "${command}". Run --help for the list.`)

  rejectUnsupportedFlags(command, values as Values)

  const profile = loadProfile(values.profile as string | undefined)
  const client = createClient(profile, values['dry-run'] === true)
  const json = values.json === true
  const yes = values.yes === true

  switch (command) {
    case 'edits list': {
      const editType = values.type as string | undefined
      if (editType && !edits.EDIT_TYPES.includes(editType)) {
        throw new UsageError(`Unknown --type "${editType}". Valid types: ${edits.EDIT_TYPES.join(', ')}.`)
      }
      await edits.listEdits(client, editType, json)
      return 0
    }
    case 'edits show':
      return await edits.showEdit(client, requireId('editId', rest[0]), json)
    case 'edits approve':
      return await edits.approveEdit(client, requireId('editId', rest[0]), yes)
    case 'locations list':
      await locations.listLocations(client, activeFilterFrom(values as Values), json)
      return 0
    case 'locations approve':
      return await locations.approveLocation(client, requireId('locationId', rest[0]), yes)
    case 'locations update':
      return await locations.updateLocation(client, requireId('locationId', rest[0]), {
        name: values.name as string | undefined,
        slug: values.slug as string | undefined,
        continent: values.continent as string | undefined,
        country: values.country as string | undefined,
        airportCode: values['airport-code'] as string | undefined,
        rating: optionalNumber('rating', values.rating as string | undefined),
        latitude: optionalNumber('latitude', values.latitude as string | undefined),
        longitude: optionalNumber('longitude', values.longitude as string | undefined),
        soloFriendly: soloFriendlyFrom(values as Values),
      }, yes)
    case 'locations image': {
      const locationId = requireId('locationId', rest[0])
      if (!rest[1]) throw new UsageError('Missing <path> to the image file.')
      return await locations.uploadLocationImage(client, locationId, rest[1], yes)
    }
    default:
      throw new UsageError(`Unknown command "${command}".`)
  }
}

try {
  process.exitCode = await main()
} catch (err) {
  if (err instanceof UsageError) {
    console.error(err.message)
    console.error('Run climbcation-admin --help for usage.')
    process.exitCode = 2
  } else if (err instanceof ConfigError || err instanceof ApiError) {
    console.error(err.message)
    process.exitCode = 1
  } else if (err instanceof Error && err.message.includes('Unknown option')) {
    console.error(err.message)
    console.error('Run climbcation-admin --help for usage.')
    process.exitCode = 2
  } else {
    throw err
  }
}
