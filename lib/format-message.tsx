import { Fragment } from "react"

// Soporta negritas estilo WhatsApp (*texto*) y markdown (**texto**), preservando saltos de línea.
export function formatMessageText(text: string) {
  const lines = text.split("\n")
  return lines.map((line, lineIdx) => {
    const parts = line.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g)
    const rendered = parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i}>{part.slice(2, -2)}</strong>
      }
      if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
        return <strong key={i}>{part.slice(1, -1)}</strong>
      }
      return part
    })
    return (
      <Fragment key={lineIdx}>
        {rendered}
        {lineIdx < lines.length - 1 && <br />}
      </Fragment>
    )
  })
}
