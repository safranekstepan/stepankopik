'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import ResultView from './ResultView'

type SystemKey = 'google' | 'meta' | 'sklik'

export default function GeneratorPanel() {
  const router = useRouter()
  const [clientUrl, setClientUrl] = useState('')
  const [clientName, setClientName] = useState('')
  const [systems, setSystems] = useState<Record<SystemKey, boolean>>({
    google: true,
    meta: true,
    sklik: true,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState('')
  const [loadedName, setLoadedName] = useState('')

  useEffect(() => {
    function onLoad(e: Event) {
      const g = (e as CustomEvent).detail
      setResult(g.result)
      setLoadedName(g.clientName)
      setClientUrl(g.clientUrl)
      setClientName(g.clientName)
      const parts = g.systems.split(',')
      setSystems({
        google: parts.includes('google'),
        meta: parts.includes('meta'),
        sklik: parts.includes('sklik'),
      })
    }
    window.addEventListener('load-generation', onLoad)
    return () => window.removeEventListener('load-generation', onLoad)
  }, [])

  function toggleSystem(key: SystemKey) {
    setSystems((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  async function handleGenerate() {
    if (!clientUrl) {
      setError('Zadej URL webu klienta.')
      return
    }
    const selectedSystems = Object.entries(systems)
      .filter(([, v]) => v)
      .map(([k]) => k)
      .join(',')
    if (!selectedSystems) {
      setError('Vyber alespoň jeden systém.')
      return
    }

    setError('')
    setLoading(true)
    setResult('')

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientUrl, clientName, systems: selectedSystems }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Generování selhalo.')
      } else {
        setResult(data.result)
        setLoadedName(clientName || new URL(clientUrl).hostname.replace('www.', ''))
        router.refresh()
      }
    } catch {
      setError('Chyba spojení.')
    } finally {
      setLoading(false)
    }
  }

  function handleDownload() {
    if (!result) return
    const name = loadedName || 'podklady'
    const blob = new Blob([result], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `podklady-ppc-${name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <main className="flex-1 flex flex-col overflow-hidden">
      {/* Form */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 shrink-0">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-48">
            <label className="block text-xs font-medium text-gray-600 mb-1">
              URL klienta *
            </label>
            <input
              type="url"
              value={clientUrl}
              onChange={(e) => setClientUrl(e.target.value)}
              placeholder="https://www.klient.cz"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex-1 min-w-36">
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Název klienta (volitelné)
            </label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Název firmy"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Systémy
            </label>
            <div className="flex gap-2">
              {(['google', 'meta', 'sklik'] as SystemKey[]).map((key) => (
                <label
                  key={key}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-md border text-sm cursor-pointer select-none transition-colors ${
                    systems[key]
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={systems[key]}
                    onChange={() => toggleSystem(key)}
                  />
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </label>
              ))}
            </div>
          </div>
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Generuji…' : 'Generovat'}
          </button>
          {result && (
            <button
              onClick={handleDownload}
              className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50 transition-colors"
            >
              Stáhnout .md
            </button>
          )}
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>

      {/* Result */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {loading && (
          <div className="flex items-center gap-3 text-gray-500">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <span className="text-sm">Studuji web a generuji copy — může to trvat 30–60 sekund…</span>
          </div>
        )}
        {!loading && result && <ResultView markdown={result} />}
        {!loading && !result && (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg mb-2">👆 Zadej URL klienta a klikni Generovat</p>
            <p className="text-sm">nebo klikni na generování v historii vlevo</p>
          </div>
        )}
      </div>
    </main>
  )
}
