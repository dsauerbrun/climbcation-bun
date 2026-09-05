// the project compiles with lib ES2023 and no DOM, and @types/node@20.4.9 predates
// its fetch globals, so nothing in the repo declares these three. declaring the
// small surface the cli actually uses keeps the project-wide lib untouched, which
// matters because widening it changes how the server typechecks too.

declare class FormData {
  append(name: string, value: string | Blob, fileName?: string): void
}

interface FetchResponse {
  readonly ok: boolean
  readonly status: number
  json(): Promise<unknown>
  text(): Promise<string>
}

interface FetchInit {
  method?: string
  headers?: Record<string, string>
  body?: string | FormData
  // bun extension. lets one request skip verification for the self signed dev
  // cert without turning it off process wide, which would also cover prod.
  tls?: { rejectUnauthorized?: boolean }
}

declare function fetch(url: string, init?: FetchInit): Promise<FetchResponse>
