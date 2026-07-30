import { NextRequest, NextResponse } from 'next/server'
import { updateGenerationResult } from '@/lib/data'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { result } = await req.json()

  if (typeof result !== 'string' || result.trim() === '') {
    return NextResponse.json({ error: 'result is required' }, { status: 400 })
  }

  const ok = await updateGenerationResult(Number(id), result)
  if (!ok) {
    return NextResponse.json({ error: 'Generation not found' }, { status: 404 })
  }

  return NextResponse.json({ ok: true })
}
