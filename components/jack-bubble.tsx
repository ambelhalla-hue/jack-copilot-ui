import { Bot } from 'lucide-react'

export function JackBubble({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-1 flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/15 ring-1 ring-primary/40">
        <Bot className="size-5 text-primary" aria-hidden="true" />
      </div>

      <div className="glass relative flex-1 rounded-2xl rounded-tl-sm p-4">
        <div className="mb-1.5 flex items-center gap-2">
          <span className="font-mono text-[11px] font-semibold uppercase tracking-widest text-primary">
            Jack
          </span>
          <span className="font-mono text-[10px] text-muted-foreground">
            IA · Étape 3/5
          </span>
        </div>
        <p className="text-[15px] leading-relaxed text-pretty md:text-base">
          {message}
        </p>
      </div>
    </div>
  )
}
