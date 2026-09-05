import { createInterface } from 'node:readline/promises'

type Cell = string | number | boolean | null | undefined

const render = (value: Cell): string => {
  if (value === null || value === undefined || value === '') return '-'
  if (typeof value === 'boolean') return value ? 'yes' : 'no'
  return String(value)
}

export const formatDate = (value: string | Date | null | undefined): string => {
  if (!value) return '-'
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toISOString().slice(0, 10)
}

export const truncate = (value: string, max: number): string =>
  value.length <= max ? value : `${value.slice(0, max - 1)}…`

export const table = (headers: string[], rows: Cell[][]): string => {
  const body = rows.map(row => row.map(render))
  const widths = headers.map((header, i) =>
    Math.max(header.length, ...body.map(row => (row[i] ?? '').length))
  )

  const line = (cells: string[]) =>
    cells.map((cell, i) => cell.padEnd(widths[i])).join('  ').trimEnd()

  return [line(headers), line(widths.map(w => '-'.repeat(w))), ...body.map(line)].join('\n')
}

export const printJson = (value: unknown): void => {
  console.log(JSON.stringify(value, null, 2))
}

export const confirm = async (question: string, assumeYes: boolean): Promise<boolean> => {
  if (assumeYes) return true

  // without a tty there is no one to answer, so refuse rather than hang. an
  // approve cannot be undone, so silently assuming yes is the wrong default.
  if (!process.stdin.isTTY) {
    console.error('Refusing to continue without confirmation. Pass --yes to run non-interactively.')
    return false
  }

  const rl = createInterface({ input: process.stdin, output: process.stdout })
  try {
    const answer = await rl.question(`${question} [y/N] `)
    return ['y', 'yes'].includes(answer.trim().toLowerCase())
  } finally {
    rl.close()
  }
}
