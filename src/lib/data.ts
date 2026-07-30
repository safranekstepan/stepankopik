import { readFile, writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'

export type Generation = {
  id: number
  clientName: string
  clientUrl: string
  systems: string
  result: string
  createdAt: string
}

type Data = { generations: Generation[] }

const FILE = path.join(process.cwd(), 'data', 'app.json')
const EMPTY: Data = { generations: [] }

async function readAll(): Promise<Data> {
  try {
    return JSON.parse(await readFile(FILE, 'utf8')) as Data
  } catch {
    return structuredClone(EMPTY)
  }
}

async function writeAll(data: Data) {
  await mkdir(path.dirname(FILE), { recursive: true })
  await writeFile(FILE, JSON.stringify(data, null, 2), 'utf8')
}

let queue: Promise<unknown> = Promise.resolve()
function update<T>(fn: (data: Data) => T): Promise<T> {
  const run = queue.then(async () => {
    const data = await readAll()
    const result = fn(data)
    await writeAll(data)
    return result
  })
  queue = run.catch(() => {})
  return run
}

export async function listGenerations(): Promise<Generation[]> {
  const data = await readAll()
  return [...data.generations].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}

export async function getGeneration(id: number): Promise<Generation | null> {
  const data = await readAll()
  return data.generations.find((g) => g.id === id) ?? null
}

export function addGeneration(
  clientName: string,
  clientUrl: string,
  systems: string,
  result: string
): Promise<number> {
  return update((data) => {
    const id = Math.max(0, ...data.generations.map((g) => g.id)) + 1
    data.generations.push({
      id,
      clientName,
      clientUrl,
      systems,
      result,
      createdAt: new Date().toISOString(),
    })
    return id
  })
}
