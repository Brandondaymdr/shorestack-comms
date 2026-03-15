export interface BadgeProps {
  count: number
}

export default function Badge({ count }: BadgeProps) {
  if (count === 0) {
    return null
  }

  const displayCount = count > 99 ? '99+' : count.toString()

  return (
    <span className="inline-block bg-sunset-coral text-white font-mono text-xs px-2 py-0.5 rounded-full">
      {displayCount}
    </span>
  )
}
