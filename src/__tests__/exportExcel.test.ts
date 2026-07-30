import { describe, expect, it } from 'vitest'
import { parseMarkdownToRows } from '@/lib/exportExcel'

describe('parseMarkdownToRows', () => {
  it('parses a Google Ads numbered headline with character count', () => {
    const md = `## GOOGLE ADS

### RSA – Hlavní sestava
Nadpisy (max 30 znaků každý):
1. Nakupte levně online (21)
`
    const rows = parseMarkdownToRows(md)

    expect(rows).toHaveLength(1)
    expect(rows[0].Systém).toBe('Google Ads')
    expect(rows[0]['Typ kampaně']).toBe('RSA')
    expect(rows[0].Téma).toBe('Hlavní sestava')
    expect(rows[0].Text).toBe('Nakupte levně online')
    expect(rows[0].Znaky).toBe(21)
  })

  it('parses Meta Ads and Google Ads sections separately', () => {
    const md = `## GOOGLE ADS

### RSA – Hlavní
Nadpisy (max 30 znaků každý):
1. Google nadpis (14)

## META ADS

### Sales
Nadpisy (~40 znaků):
1. Meta nadpis (12)
`
    const rows = parseMarkdownToRows(md)

    const google = rows.filter((r) => r.Systém === 'Google Ads')
    const meta = rows.filter((r) => r.Systém === 'Meta Ads')

    expect(google).toHaveLength(1)
    expect(meta).toHaveLength(1)
  })

  it('returns empty array for markdown with no ad content', () => {
    const md = `# Jen nadpis\n\nNějaký text bez reklam.`
    const rows = parseMarkdownToRows(md)
    expect(rows).toHaveLength(0)
  })
})
