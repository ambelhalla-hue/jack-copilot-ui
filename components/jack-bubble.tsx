import { Bot, Wrench } from 'lucide-react'
import { cn } from '@/lib/utils'

type Block = { phase: string | null; lines: string[] }

const phaseRegex = /^\s*\**\s*(phase\s*\d[^:]*)\s*:\s*/i

function parse(message: string): Block[] {
  const blocks: Block[] = []

  for (const rawLine of message.split('\n')) {
    const line = rawLine.replace(/\*\*/g, '').trimEnd()
    if (!line.trim()) continue

    const match = rawLine.match(phaseRegex)
    if (match) {
      const rest = line.replace(phaseRegex, '').trim()
      blocks.push({ phase: match[1].trim(), lines: rest ? [rest] : [] })
      continue
    }

    if (blocks.length === 0) blocks.push({ phase: null, lines: [] })
    blocks[blocks.length - 1].lines.push(line.replace(/^[-*•]\s*/, '• '))
  }

  return blocks
}

export function JackBubble({
  message,
  streaming = false,
  step,
}: {
  message: string
  streaming?: boolean
  step?: string
}) {
  const blocks = parse(message)

  return (
    <div className="flex items-start gap-3">
      <div className="mt-1 flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/15 ring-1 ring-primary/40">
        <Bot className="size-5 text-primary" aria-hidden="true" />
      </div>

      <div
        className="glass relative flex-1 rounded-2xl rounded-tl-sm p-4"
        aria-live="polite"
        aria-busy={streaming}
      >
        <div className="mb-2 flex items-center gap-2">
          <span className="font-mono text-[11px] font-semibold uppercase tracking-widest text-primary">
            Jack
          </span>
          <span className="font-mono text-[10px] text-muted-foreground">
            {step ?? 'Chef d’atelier · Gemini'}
          </span>
          {streaming && (
            <span className="ml-auto flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              <Wrench className="size-3 animate-pulse-signal" aria-hidden="true" />
              analyse
            </span>
          )}
        </div>

        {message.trim().length === 0 && streaming ? (
          <div className="flex flex-col gap-2" aria-hidden="true">
            <span className="h-3 w-4/5 rounded-full bg-muted-foreground/20 animate-pulse-signal" />
            <span className="h-3 w-3/5 rounded-full bg-muted-foreground/15 animate-pulse-signal" />
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {blocks.map((block, i) => (
              <div key={i} className="flex flex-col gap-1.5">
                {block.phase && (
                  <span
                    className={cn(
                      'w-fit rounded-md px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest',
                      i === 0
                        ? 'bg-primary/15 text-primary'
                        : 'bg-secondary/70 text-muted-foreground',
                    )}
                  >
                    {block.phase}
                  </span>
                )}
                {block.lines.map((line, j) => (
                  <p
                    key={j}
                    className="text-[15px] leading-relaxed text-pretty md:text-base"
                  >
                    {line}
                  </p>
                ))}
              </div>
            ))}
            {streaming && (
              <span
                aria-hidden="true"
                className="inline-block h-4 w-1.5 rounded-sm bg-primary animate-pulse-signal"
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
