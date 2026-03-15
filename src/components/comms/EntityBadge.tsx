export interface EntityBadgeProps {
  tag: string
}

export default function EntityBadge({ tag }: EntityBadgeProps) {
  return (
    <span className="inline-block bg-driftwood/15 text-driftwood font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full">
      {tag}
    </span>
  )
}
