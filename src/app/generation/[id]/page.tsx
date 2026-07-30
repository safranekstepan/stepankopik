import { getGeneration } from '@/lib/data'
import { notFound } from 'next/navigation'
import ResultView from '@/components/ResultView'
import EvisionsLogo from '@/components/EvisionsLogo'
import LogoutButton from '@/components/LogoutButton'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function GenerationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const generation = await getGeneration(Number(id))

  if (!generation) notFound()

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-sm text-gray-400 hover:text-white transition-colors">
            ← zpět
          </Link>
          <h1 className="text-xl font-semibold tracking-tight text-white">stepankopik</h1>
        </div>
        <div className="flex items-center gap-4">
          <LogoutButton />
          <EvisionsLogo />
        </div>
      </header>

      {/* Meta */}
      <div className="bg-white border-b border-gray-100 px-6 py-3">
        <p className="text-sm font-medium text-gray-800">{generation.clientName}</p>
        <p className="text-xs text-gray-400 mt-0.5">
          {generation.clientUrl} ·{' '}
          {new Date(generation.createdAt).toLocaleDateString('cs-CZ', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}{' '}
          · {generation.systems}
        </p>
      </div>

      {/* Result */}
      <main className="flex-1 px-6 py-6 max-w-3xl">
        <ResultView markdown={generation.result} />
      </main>
    </div>
  )
}
