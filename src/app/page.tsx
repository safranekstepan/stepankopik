import { listGenerations } from '@/lib/data'
import Sidebar from '@/components/Sidebar'
import GeneratorPanel from '@/components/GeneratorPanel'
import EvisionsLogo from '@/components/EvisionsLogo'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const generations = await listGenerations()

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 bg-gray-900 border-b border-gray-800 shrink-0">
        <h1 className="text-xl font-semibold tracking-tight text-white">stepankopik</h1>
        <EvisionsLogo />
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar generations={generations} />
        <GeneratorPanel />
      </div>
    </div>
  )
}
