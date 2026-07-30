import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { addGeneration } from '@/lib/data'

export async function POST(req: NextRequest) {
  const { clientName, clientUrl, systems } = await req.json()

  if (!clientUrl) {
    return NextResponse.json({ error: 'clientUrl is required' }, { status: 400 })
  }

  // Guard against SSRF: only allow public HTTPS URLs
  try {
    const parsed = new URL(clientUrl)
    if (parsed.protocol !== 'https:') {
      return NextResponse.json({ error: 'Only HTTPS URLs are allowed.' }, { status: 400 })
    }
    const hostname = parsed.hostname
    const isPrivate =
      hostname === 'localhost' ||
      hostname.startsWith('127.') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('172.') ||
      hostname === '0.0.0.0' ||
      hostname === '169.254.169.254'
    if (isPrivate) {
      return NextResponse.json({ error: 'Private/internal URLs are not allowed.' }, { status: 400 })
    }
  } catch {
    return NextResponse.json({ error: 'Invalid URL.' }, { status: 400 })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY is not set in .env.local' },
      { status: 500 }
    )
  }

  // Fetch the client website
  let websiteContent = ''
  try {
    const res = await fetch(clientUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; stepankopik/1.0)' },
      signal: AbortSignal.timeout(15000),
    })
    const html = await res.text()
    // Strip HTML tags, keep text content
    websiteContent = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 8000)
  } catch {
    return NextResponse.json(
      { error: `Could not fetch the website: ${clientUrl}` },
      { status: 422 }
    )
  }

  const systemsList = systems || 'google,meta,sklik'
  const systemsLabel = systemsList
    .split(',')
    .map((s: string) => s.trim())
    .join(', ')

  const prompt = `Jsi seniorní PPC copywriter. Z obsahu webu klienta níže vygeneruj kompletní reklamní podklady pro systémy: ${systemsLabel}.

WEB KLIENTA (${clientUrl}):
${websiteContent}

INSTRUKCE:
- Výstup piš česky (nebo v jazyce webu)
- Dodržuj přesně znakové limity pro každé pole
- Za každým prvkem uveď počet znaků v závorce, např.: Nadpis textu (24)
- Rozliš e-shop vs lead-gen podle webu
- Vytvoř minimálně 3–5 tematických sestav

FORMÁT VÝSTUPU (Markdown):

# PPC podklady – ${clientName || clientUrl}

**Analýza webu:** [2–4 věty: business model, USP, klíčové proof pointy, tón]
**Jazyk:** čeština | **Systémy:** ${systemsLabel}

---
${
  systemsList.includes('google')
    ? `## GOOGLE ADS

### RSA – [téma sestavy 1]
Nadpisy (max 30 znaků každý):
1. … (počet)
[celkem 15 nadpisů]

Popisy (max 90 znaků každý):
1. … (počet)
[celkem 4 popisy]

Cesty (max 15 znaků): /… | /…

### RSA – [téma sestavy 2]
[stejná struktura]

### PMax – asset group [téma]
Krátké nadpisy (max 30 znaků, alespoň 1 do 15 znaků):
[15 nadpisů]

Dlouhé nadpisy (max 90 znaků):
[5 nadpisů]

Popisy (max 90 znaků):
[5 popisů]

Krátký popis (max 60 znaků): …
Název firmy (max 25 znaků): …

### Rozšíření
Sitelinky (nadpis max 25, popis 2× max 35):
…
Popisky/callouts (max 25 znaků každý):
…
Strukturované úryvky (max 25 znaků):
…

---`
    : ''
}
${
  systemsList.includes('meta')
    ? `## META ADS

### Sales / Advantage+ Shopping
Primární text (~125 znaků):
[5 variant]

Nadpisy (~40 znaků):
[5 variant]

Popis odkazu (~30 znaků): …
CTA: [tlačítko]

### Leads
Primární text (~125 znaků):
[5 variant]

Nadpisy (~40 znaků):
[5 variant]

Popis odkazu (~30 znaků): …
CTA: [tlačítko]

---`
    : ''
}
${
  systemsList.includes('sklik')
    ? `## SKLIK

### Textová reklama (Vyhledávání) – [téma 1]
Varianta 1:
Titulek 1 (max 30): … | Titulek 2 (max 30): … | Popisek (max 90): … | Cesty: /… | /…

Varianta 2:
Titulek 1 (max 30): … | Titulek 2 (max 30): … | Popisek (max 90): … | Cesty: /… | /…

Varianta 3:
Titulek 1 (max 30): … | Titulek 2 (max 30): … | Popisek (max 90): … | Cesty: /… | /…

### Kombinovaná reklama (Obsahová síť)
Krátký nadpis (max 25): … | Dlouhý nadpis (max 90): … | Popisek (max 90): … | Název firmy (max 25): …

Sitelinky/Popisky:
…`
    : ''
}

Vygeneruj SKUTEČNÝ copy pro tohoto klienta — ne placeholdery nebo vzory. Každý prvek musí být vyplněný konkrétním textem.`

  const client = new Anthropic({ apiKey })

  const message = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 8192,
    messages: [{ role: 'user', content: prompt }],
  })

  const result =
    message.content[0].type === 'text' ? message.content[0].text : ''

  const resolvedClientName =
    clientName ||
    (() => {
      try {
        return new URL(clientUrl).hostname.replace('www.', '')
      } catch {
        return clientUrl
      }
    })()

  const id = await addGeneration(resolvedClientName, clientUrl, systemsList, result)

  return NextResponse.json({ id, result })
}
