import type { Profile } from './config.js'

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export interface Client {
  readonly dryRun: boolean
  get<T>(path: string): Promise<T>
  put<T>(path: string, body?: unknown): Promise<T>
  postForm<T>(path: string, form: FormData): Promise<T>
}

const isSelfSignedError = (message: string): boolean =>
  /self.signed|unable to verify|DEPTH_ZERO/i.test(message)

export const createClient = (profile: Profile, dryRun: boolean): Client => {
  const send = async <T>(method: string, path: string, init: FetchInit): Promise<T> => {
    const url = `${profile.url}${path}`

    // reads always run, even under dry run. every preview and confirmation below
    // is built from live data, so suppressing gets would make a dry run describe
    // an empty database instead of the change it is about to make.
    if (dryRun && method !== 'GET') {
      console.log(`[dry-run] ${method} ${url}`)
      if (typeof init.body === 'string') console.log(`[dry-run] body ${init.body}`)
      else if (init.body) console.log('[dry-run] body <multipart form data>')
      return {} as T
    }

    let res: FetchResponse
    try {
      res = await fetch(url, {
        ...init,
        method,
        headers: { 'x-admin-password': profile.adminPassword, ...(init.headers ?? {}) },
        ...(profile.insecure ? { tls: { rejectUnauthorized: false } } : {}),
      })
    } catch (err) {
      const message = (err as Error).message
      if (isSelfSignedError(message)) {
        throw new ApiError(0, `${url} uses a self-signed certificate. Set "insecure": true on profile "${profile.name}" to accept it.`)
      }
      throw new ApiError(0, `Could not reach ${url}: ${message}`)
    }

    // every admin route sends errors as plain text via res.send(), so read the
    // body as text first and only parse json once we know the call succeeded.
    if (!res.ok) {
      const body = (await res.text()).trim()
      if (res.status === 401) {
        throw new ApiError(401, `Unauthorized. The adminPassword for profile "${profile.name}" does not match ADMIN_PASSWORD on the server.`)
      }
      throw new ApiError(res.status, body || `Request failed with status ${res.status}`)
    }

    const text = await res.text()
    if (!text) return {} as T

    try {
      return JSON.parse(text) as T
    } catch {
      throw new ApiError(res.status, `Expected JSON from ${url} but got: ${text.slice(0, 200)}`)
    }
  }

  return {
    dryRun,
    get: <T>(path: string) => send<T>('GET', path, {}),
    put: <T>(path: string, body?: unknown) => send<T>('PUT', path, {
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body ?? {}),
    }),
    // no content-type here on purpose. fetch sets it along with the multipart
    // boundary, and setting it by hand produces a boundary multer cannot parse.
    postForm: <T>(path: string, form: FormData) => send<T>('POST', path, { body: form }),
  }
}
