import * as XLSX from 'xlsx'

type AdRow = {
  Systém: string
  'Typ kampaně': string
  Téma: string
  Pole: string
  Text: string
  Znaky: number
}

// Extract character count from a string like "Nakupte levně (14)"
function extractCount(text: string): { text: string; count: number } {
  const match = text.match(/^(.*?)\s*\((\d+)\)\s*$/)
  if (match) {
    return { text: match[1].trim(), count: parseInt(match[2], 10) }
  }
  const trimmed = text.trim()
  return { text: trimmed, count: trimmed.length }
}

export function parseMarkdownToRows(markdown: string): AdRow[] {
  const rows: AdRow[] = []
  const lines = markdown.split('\n')

  let currentSystem = ''
  let currentCampaign = ''
  let currentTheme = ''
  let currentField = ''

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    // ## GOOGLE ADS / ## META ADS / ## SKLIK
    if (line.startsWith('## ')) {
      const heading = line.slice(3).toUpperCase()
      if (heading.includes('GOOGLE')) currentSystem = 'Google Ads'
      else if (heading.includes('META')) currentSystem = 'Meta Ads'
      else if (heading.includes('SKLIK')) currentSystem = 'Sklik'
      else currentSystem = line.slice(3)
      currentCampaign = ''
      currentTheme = ''
      currentField = ''
      continue
    }

    // ### RSA – téma / ### PMax / ### Textová reklama
    if (line.startsWith('### ')) {
      const sub = line.slice(4)
      const dashIdx = sub.indexOf('–')
      const spaceIdx = sub.indexOf(' – ')

      if (spaceIdx !== -1) {
        currentCampaign = sub.slice(0, spaceIdx).trim()
        currentTheme = sub.slice(spaceIdx + 3).trim()
      } else if (dashIdx !== -1) {
        currentCampaign = sub.slice(0, dashIdx).trim()
        currentTheme = sub.slice(dashIdx + 1).trim()
      } else {
        currentCampaign = sub.trim()
        currentTheme = ''
      }
      currentField = ''
      continue
    }

    // Field labels like "Nadpisy (max 30 znaků každý):" or "Popisy (90):"
    if (line.match(/^(Nadpis|Popis|Cest|Krátk|Dlouh|Primární|Název|CTA|Sitelink|Popisky|Strukt|Titulek|Varianta)/i) && line.endsWith(':')) {
      currentField = line.replace(/:$/, '').trim()
      continue
    }

    // "Nadpisy (max 30 znaků každý):" as a label (with colon mid-string)
    const fieldMatch = line.match(/^(Nadpis[^:]*|Popis[^:]*|Cest[^:]*|Krátk[^:]*|Dlouh[^:]*|Primární[^:]*|Název[^:]*|CTA[^:]*|Titulek[^:]*):\s*(.*)$/)
    if (fieldMatch) {
      currentField = fieldMatch[1].trim()
      const rest = fieldMatch[2].trim()
      if (rest) {
        const { text, count } = extractCount(rest)
        if (text) {
          rows.push({
            Systém: currentSystem,
            'Typ kampaně': currentCampaign,
            Téma: currentTheme,
            Pole: currentField,
            Text: text,
            Znaky: count,
          })
        }
      }
      continue
    }

    // Numbered items: "1. Text nadpisu (24)"
    const numberedMatch = line.match(/^\d+\.\s+(.+)$/)
    if (numberedMatch && currentSystem) {
      const { text, count } = extractCount(numberedMatch[1])
      if (text && text !== '…' && !text.startsWith('[')) {
        rows.push({
          Systém: currentSystem,
          'Typ kampaně': currentCampaign,
          Téma: currentTheme,
          Pole: currentField,
          Text: text,
          Znaky: count,
        })
      }
      continue
    }

    // Sklik inline format: "Titulek 1 (30): text | Titulek 2 (30): text | ..."
    if (line.includes('Titulek') && line.includes('|') && currentSystem === 'Sklik') {
      const parts = line.split('|')
      for (const part of parts) {
        const inlineMatch = part.match(/^([\w\s]+)\s*\(\d+\):\s*(.+)$/)
        if (inlineMatch) {
          const fieldName = inlineMatch[1].trim()
          const { text, count } = extractCount(inlineMatch[2])
          if (text && text !== '…') {
            rows.push({
              Systém: currentSystem,
              'Typ kampaně': currentCampaign,
              Téma: currentTheme,
              Pole: fieldName,
              Text: text,
              Znaky: count,
            })
          }
        }
      }
      continue
    }

    // Standalone line with character count in parens — likely a value
    if (currentSystem && currentField && line.match(/\(\d+\)$/)) {
      const { text, count } = extractCount(line)
      if (text && text !== '…' && !text.startsWith('[') && !text.startsWith('#')) {
        rows.push({
          Systém: currentSystem,
          'Typ kampaně': currentCampaign,
          Téma: currentTheme,
          Pole: currentField,
          Text: text,
          Znaky: count,
        })
      }
    }
  }

  return rows
}

export function downloadExcel(markdown: string, clientName: string) {
  const rows = parseMarkdownToRows(markdown)

  if (rows.length === 0) {
    // Fallback: dump raw markdown into a single cell
    const ws = XLSX.utils.aoa_to_sheet([['Copy'], [markdown]])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Copy')
    XLSX.writeFile(wb, `podklady-ppc-${clientName || 'export'}.xlsx`)
    return
  }

  const wb = XLSX.utils.book_new()

  // Sheet 1: flat table — all rows
  const ws = XLSX.utils.json_to_sheet(rows)

  // Column widths
  ws['!cols'] = [
    { wch: 12 }, // Systém
    { wch: 20 }, // Typ kampaně
    { wch: 20 }, // Téma
    { wch: 25 }, // Pole
    { wch: 60 }, // Text
    { wch: 8 },  // Znaky
  ]

  XLSX.utils.book_append_sheet(wb, ws, 'PPC copy')

  const safeName = (clientName || 'export').replace(/[^a-z0-9]/gi, '-').toLowerCase()
  XLSX.writeFile(wb, `podklady-ppc-${safeName}.xlsx`)
}
