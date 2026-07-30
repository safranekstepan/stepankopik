import { mkdtemp, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// data.ts builds its path from process.cwd() — redirect to a temp folder per test
let dir: string

beforeEach(async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'stepankopik-test-'))
  vi.spyOn(process, 'cwd').mockReturnValue(dir)
  // Reset the module so each test gets a fresh queue and fresh FILE path
  vi.resetModules()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('addGeneration', () => {
  it('saves a generation to disk and returns its id', async () => {
    const { addGeneration } = await import('@/lib/data')

    const id = await addGeneration('Klient A', 'https://klienta.cz', 'google', '# Copy')

    expect(id).toBe(1)
    const saved = JSON.parse(await readFile(path.join(dir, 'data', 'app.json'), 'utf8'))
    expect(saved.generations).toHaveLength(1)
    expect(saved.generations[0].clientName).toBe('Klient A')
    expect(saved.generations[0].clientUrl).toBe('https://klienta.cz')
  })

  it('assigns sequential ids', async () => {
    const { addGeneration } = await import('@/lib/data')

    const id1 = await addGeneration('Klient A', 'https://a.cz', 'google', 'copy A')
    const id2 = await addGeneration('Klient B', 'https://b.cz', 'meta', 'copy B')

    expect(id1).toBe(1)
    expect(id2).toBe(2)
  })

  it('handles 3 concurrent writes without losing records', async () => {
    const { addGeneration } = await import('@/lib/data')

    await Promise.all([
      addGeneration('A', 'https://a.cz', 'google', 'copy'),
      addGeneration('B', 'https://b.cz', 'meta', 'copy'),
      addGeneration('C', 'https://c.cz', 'sklik', 'copy'),
    ])

    const saved = JSON.parse(await readFile(path.join(dir, 'data', 'app.json'), 'utf8'))
    expect(saved.generations).toHaveLength(3)
  })
})

describe('listGenerations', () => {
  it('returns generations sorted newest first', async () => {
    const { addGeneration, listGenerations } = await import('@/lib/data')

    await addGeneration('Starý', 'https://old.cz', 'google', 'copy')
    // Small delay so createdAt timestamps differ
    await new Promise((r) => setTimeout(r, 10))
    await addGeneration('Nový', 'https://new.cz', 'meta', 'copy')

    const list = await listGenerations()
    expect(list[0].clientName).toBe('Nový')
    expect(list[1].clientName).toBe('Starý')
  })
})

describe('getGeneration', () => {
  it('returns the generation by id', async () => {
    const { addGeneration, getGeneration } = await import('@/lib/data')

    const id = await addGeneration('Klient', 'https://klient.cz', 'google', '# Copy')
    const g = await getGeneration(id)

    expect(g).not.toBeNull()
    expect(g!.clientName).toBe('Klient')
  })

  it('returns null for a non-existent id', async () => {
    const { getGeneration } = await import('@/lib/data')

    const g = await getGeneration(999)
    expect(g).toBeNull()
  })
})

describe('updateGenerationResult', () => {
  it('updates the result of an existing generation', async () => {
    const { addGeneration, getGeneration, updateGenerationResult } = await import('@/lib/data')

    const id = await addGeneration('Klient', 'https://klient.cz', 'google', 'původní copy')
    await updateGenerationResult(id, 'upravená copy')

    const g = await getGeneration(id)
    expect(g!.result).toBe('upravená copy')
  })
})
