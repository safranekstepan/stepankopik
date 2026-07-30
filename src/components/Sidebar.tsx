'use client'

import { Generation } from '@/lib/data'
import { useState } from 'react'

type Props = {
  generations: Generation[]
}

export default function Sidebar({ generations }: Props) {
  const [selected, setSelected] = useState<number | null>(null)

  function handleSelect(g: Generation) {
    setSelected(g.id)
    // Dispatch custom event so GeneratorPanel can pick it up
    window.dispatchEvent(
      new CustomEvent('load-generation', { detail: g })
    )
  }

  return (
    <aside className="w-64 shrink-0 bg-white border-r border-gray-200 flex flex-col overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Historie
        </p>
      </div>
      <div className="flex-1 overflow-y-auto">
        {generations.length === 0 ? (
          <p className="px-4 py-6 text-sm text-gray-400">
            Zatím žádné generování.
          </p>
        ) : (
          <ul>
            {generations.map((g) => (
              <li key={g.id}>
                <button
                  onClick={() => handleSelect(g)}
                  className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                    selected === g.id ? 'bg-orange-50 border-l-2 border-l-orange-500' : ''
                  }`}
                >
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {g.clientName}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(g.createdAt).toLocaleDateString('cs-CZ', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                  <p className="text-xs text-gray-400 truncate mt-0.5">
                    {g.systems}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  )
}
