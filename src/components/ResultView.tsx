'use client'

type Props = {
  markdown: string
}

// Simple Markdown renderer without external deps.
// Handles: h1-h3, bold, code blocks, inline code, tables, paragraphs, lists.
export default function ResultView({ markdown }: Props) {
  const lines = markdown.split('\n')
  const elements: React.ReactNode[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // Code block
    if (line.startsWith('```')) {
      const codeLines: string[] = []
      i++
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      elements.push(
        <pre key={i} className="bg-gray-100 rounded-md p-4 text-sm overflow-x-auto my-3 font-mono">
          <code>{codeLines.join('\n')}</code>
        </pre>
      )
      i++
      continue
    }

    // HR
    if (line.trim() === '---') {
      elements.push(<hr key={i} className="my-6 border-gray-200" />)
      i++
      continue
    }

    // H1
    if (line.startsWith('# ')) {
      elements.push(
        <h1 key={i} className="text-2xl font-bold mt-6 mb-2 text-gray-900">
          {renderInline(line.slice(2))}
        </h1>
      )
      i++
      continue
    }

    // H2
    if (line.startsWith('## ')) {
      elements.push(
        <h2 key={i} className="text-lg font-bold mt-6 mb-2 text-gray-800 border-b border-gray-200 pb-1">
          {renderInline(line.slice(3))}
        </h2>
      )
      i++
      continue
    }

    // H3
    if (line.startsWith('### ')) {
      elements.push(
        <h3 key={i} className="text-base font-semibold mt-4 mb-1 text-gray-800">
          {renderInline(line.slice(4))}
        </h3>
      )
      i++
      continue
    }

    // Table
    if (line.includes('|')) {
      const tableLines: string[] = []
      while (i < lines.length && lines[i].includes('|')) {
        tableLines.push(lines[i])
        i++
      }
      const rows = tableLines.filter((l) => !l.match(/^\|[-| ]+\|$/))
      elements.push(
        <div key={i} className="overflow-x-auto my-3">
          <table className="text-sm border-collapse w-full">
            <tbody>
              {rows.map((row, ri) => (
                <tr key={ri} className={ri === 0 ? 'bg-gray-100 font-semibold' : 'border-t border-gray-200'}>
                  {row
                    .split('|')
                    .filter((_, ci) => ci > 0 && ci < row.split('|').length - 1)
                    .map((cell, ci) => (
                      <td key={ci} className="px-3 py-1.5 text-left whitespace-nowrap">
                        {renderInline(cell.trim())}
                      </td>
                    ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
      continue
    }

    // List item
    if (line.match(/^[-*] /)) {
      const items: string[] = []
      while (i < lines.length && lines[i].match(/^[-*] /)) {
        items.push(lines[i].slice(2))
        i++
      }
      elements.push(
        <ul key={i} className="list-disc list-inside my-2 space-y-1 text-sm text-gray-700">
          {items.map((item, ii) => (
            <li key={ii}>{renderInline(item)}</li>
          ))}
        </ul>
      )
      continue
    }

    // Empty line
    if (line.trim() === '') {
      i++
      continue
    }

    // Paragraph
    elements.push(
      <p key={i} className="text-sm text-gray-700 my-1 leading-relaxed">
        {renderInline(line)}
      </p>
    )
    i++
  }

  return <div className="max-w-3xl">{elements}</div>
}

function renderInline(text: string): React.ReactNode {
  // Bold + inline code
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={i} className="bg-gray-100 px-1 rounded text-xs font-mono">
          {part.slice(1, -1)}
        </code>
      )
    }
    return part
  })
}
