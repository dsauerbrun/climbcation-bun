import { existsSync, readFileSync, statSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

export const CONFIG_PATH = join(homedir(), '.climbcation-admin.json')

export interface Profile {
  name: string
  url: string
  adminPassword: string
  insecure: boolean
}

interface StoredProfile {
  url?: string
  adminPassword?: string
  insecure?: boolean
}

interface ConfigFile {
  defaultProfile?: string
  profiles?: Record<string, StoredProfile>
}

export class ConfigError extends Error {}

const SAMPLE = `{
  "defaultProfile": "local",
  "profiles": {
    "local": {
      "url": "https://localhost:3000",
      "adminPassword": "<the ADMIN_PASSWORD from .env>",
      "insecure": true
    },
    "prod": {
      "url": "https://climbcation.com",
      "adminPassword": "<the ADMIN_PASSWORD from the server env>"
    }
  }
}`

const readConfigFile = (): ConfigFile => {
  if (!existsSync(CONFIG_PATH)) return {}

  let raw: string
  try {
    raw = readFileSync(CONFIG_PATH, 'utf8')
  } catch (err) {
    throw new ConfigError(`Could not read ${CONFIG_PATH}: ${(err as Error).message}`)
  }

  try {
    return JSON.parse(raw) as ConfigFile
  } catch (err) {
    throw new ConfigError(`${CONFIG_PATH} is not valid JSON: ${(err as Error).message}`)
  }
}

// the file holds the admin password in plaintext, so say something if anyone
// else on the box can read it. a warning rather than a hard failure since the
// env vars are a legitimate way to run without the file mattering at all.
const warnIfWorldReadable = (): void => {
  if (!existsSync(CONFIG_PATH)) return

  if ((statSync(CONFIG_PATH).mode & 0o077) !== 0) {
    console.error(`warning: ${CONFIG_PATH} contains your admin password and is readable by other users.`)
    console.error(`         fix with: chmod 600 ${CONFIG_PATH}`)
  }
}

export const loadProfile = (requested?: string): Profile => {
  const file = readConfigFile()
  warnIfWorldReadable()

  if (requested && !file.profiles?.[requested]) {
    const known = Object.keys(file.profiles ?? {})
    throw new ConfigError(
      known.length
        ? `Unknown profile "${requested}". Known profiles: ${known.join(', ')}`
        : `Unknown profile "${requested}". No profiles are defined in ${CONFIG_PATH}.`
    )
  }

  const name = requested ?? process.env.CLIMBCATION_PROFILE ?? file.defaultProfile ?? 'local'
  const stored = file.profiles?.[name] ?? {}

  const url = process.env.CLIMBCATION_API_URL ?? stored.url
  const adminPassword = process.env.CLIMBCATION_ADMIN_PASSWORD ?? stored.adminPassword
  const insecure = process.env.CLIMBCATION_INSECURE === 'true' || stored.insecure === true

  if (!url || !adminPassword) {
    const missing = [!url ? 'url' : null, !adminPassword ? 'adminPassword' : null].filter(Boolean).join(' and ')
    throw new ConfigError(
      `Profile "${name}" is missing ${missing}.\n\n` +
      `Create ${CONFIG_PATH} (then chmod 600 it):\n\n${SAMPLE}\n\n` +
      `Or set CLIMBCATION_API_URL and CLIMBCATION_ADMIN_PASSWORD in the environment.`
    )
  }

  return { name, url: url.replace(/\/+$/, ''), adminPassword, insecure }
}
