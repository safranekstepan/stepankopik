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

  // Demo mode — no API key set, return sample copy so the UI can be tested
  if (!apiKey) {
    const resolvedName = clientName || (() => {
      try { return new URL(clientUrl).hostname.replace('www.', '') } catch { return clientUrl }
    })()
    const demoResult = `# PPC podklady – ${resolvedName} (DEMO)

> ⚠️ Toto je ukázkový výstup — API key není nastaven. Výsledek slouží k testování UI.

**Analýza webu:** ${resolvedName} je ukázkový klient. Business model, USP a proof pointy by zde byly vyplněny na základě skutečného webu.
**Jazyk:** čeština | **Systémy:** ${systems || 'google,meta,sklik'}

---
## GOOGLE ADS

### RSA – Hlavní sestava
Nadpisy (30):
1. Kvalitní služby pro vás (28)
2. Ověřený partner na trhu (25)
3. Rychlé řešení vašich potřeb (29)
4. Zkušenosti více než 10 let (27)
5. Bezplatná konzultace zdarma (28)
6. Spolehlivost a profesionalita (30)
7. Výsledky, které vidíte (22)
8. Kontaktujte nás ještě dnes (27)
9. Přes 500 spokojených klientů (30)
10. Garantujeme vaši spokojenost (30)
11. Moderní přístup, jasné výsledky (32)
12. Individuální řešení na míru (29)
13. Transparentní ceny bez skrytých (30)
14. Začněte ještě tento týden (27)
15. Vyzkoušejte bez závazků (24)

Popisy (90):
1. Pomáháme firmám růst díky ověřeným řešením. Kontaktujte nás a zjistěte, co pro vás můžeme udělat. (92)
2. Více než 10 let zkušeností v oboru. Přes 500 spokojených klientů. Bezplatná konzultace bez závazků. (93)
3. Rychle, spolehlivě a s garancí výsledků. Individuální přístup ke každému projektu. Zavolejte nám. (88)
4. Moderní řešení pro vaše podnikání. Transparentní ceny a jasné výsledky. Začněte ještě dnes zdarma. (89)

Cesty (15): /sluzby | /kontakt

---
## META ADS

### Sales / Advantage+
Primární text (~125):
1. Hledáte spolehlivého partnera? Pomáháme firmám dosahovat výsledků. Více než 10 let zkušeností, přes 500 klientů. (107)
2. Kvalita, která se vyplatí. Individuální přístup, transparentní ceny a výsledky, které vidíte. Zjistěte více. (99)
3. Váš úspěch je naším cílem. Nabízíme komplexní řešení šitá na míru vašim potřebám. Kontaktujte nás dnes. (101)
4. Moderní přístup k tradičním hodnotám. Spolehlivost, profesionalita a 100% zákaznická spokojenost. (90)
5. Ušetřete čas a peníze s ověřeným řešením. Bezplatná konzultace bez závazků. Začněte ještě dnes. (92)

Nadpisy (~40):
1. Ověřený partner pro váš růst (30)
2. Výsledky, které mluví za vše (29)
3. 10 let zkušeností v oboru (26)
4. Bezplatná konzultace zdarma (26)
5. Začněte ještě dnes (19)

Popis odkazu (~30): Zjistěte více o naší nabídce (30)
CTA: Zjistit více

---
## SKLIK

### Textová reklama – Hlavní
Varianta 1:
Titulek 1 (30): Spolehlivé služby pro firmy (28) | Titulek 2 (30): Konzultace zdarma (18) | Popisek (90): Více než 10 let zkušeností, přes 500 klientů. Kontaktujte nás ještě dnes. (75) | Cesty: /sluzby | /kontakt

Varianta 2:
Titulek 1 (30): Ověřený partner na trhu (24) | Titulek 2 (30): Výsledky bez závazků (21) | Popisek (90): Individuální přístup a transparentní ceny. Bezplatná konzultace bez závazků. Zavolejte. (83) | Cesty: /o-nas | /kontakt

Varianta 3:
Titulek 1 (30): Profesionální řešení na míru (30) | Titulek 2 (30): Rychle a spolehlivě (19) | Popisek (90): Garantujeme vaši spokojenost. Více než 500 spokojených klientů po celé ČR. Zkuste nás. (88) | Cesty: /reference | /kontakt

### Kombinovaná reklama
Krátký nadpis (25): Spolehlivé služby (17) | Dlouhý nadpis (90): Ověřený partner pro váš byznys — konzultace zdarma, výsledky bez závazků (72) | Popisek (90): Individuální přístup, transparentní ceny. Přes 500 spokojených klientů. Kontaktujte nás dnes. (87) | Název firmy (25): ${resolvedName.slice(0, 25)} (${resolvedName.slice(0, 25).length})
`
    const id = await addGeneration(resolvedName, clientUrl, systems || 'google,meta,sklik', demoResult)
    return NextResponse.json({ id, result: demoResult })
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
