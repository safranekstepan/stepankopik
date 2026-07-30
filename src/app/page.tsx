import { listGenerations } from '@/lib/data'
import Sidebar from '@/components/Sidebar'
import GeneratorPanel from '@/components/GeneratorPanel'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const generations = await listGenerations()

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200 shrink-0">
        <h1 className="text-xl font-semibold tracking-tight">stepankopik</h1>
        <span className="text-sm font-bold text-blue-700 tracking-widest uppercase">
          evisions
        </span>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar generations={generations} />
        <GeneratorPanel />
      </div>
    </div>
  )
}
