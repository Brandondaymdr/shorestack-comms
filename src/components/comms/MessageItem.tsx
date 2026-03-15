'use client'

import Avatar from '@/components/ui/Avatar'
import { formatTimestamp } from '@/lib/utils/timestamps'
import type { Message } from '@/types/comms'

interface MessageItemProps {
  message: Message
  showAuthor?: boolean
}

export default function MessageItem({
  message,
  showAuthor = true,
}: MessageItemProps) {
  if (message.is_deleted && !message.content) {
    return null
  }

  const displayName = message.user_profile?.display_name || 'Unknown'
  const avatarUrl = message.user_profile?.avatar_url || undefined
  const timestamp = formatTimestamp(message.created_at)

  if (showAuthor) {
    return (
      <div className="flex gap-3 py-2 px-3 hover:bg-deep-ocean/[0.02] rounded transition-colors">
        {/* Avatar */}
        <div className="flex-shrink-0 pt-1">
          <Avatar name={displayName} avatarUrl={avatarUrl} size="sm" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header: name + timestamp */}
          <div className="flex items-baseline gap-2 mb-1">
            <span className="font-mono text-sm font-semibold text-deep-slate">
              {displayName}
            </span>
            <span className="font-mono text-xs text-driftwood">
              {timestamp}
            </span>
          </div>

          {/* Message content */}
          <div
            className={`text-sm leading-relaxed ${
              message.is_deleted
                ? 'italic text-driftwood/50'
                : 'text-deep-slate'
            }`}
          >
            {message.content || '(deleted)'}
          </div>
        </div>
      </div>
    )
  } else {
    // Grouped message (no author shown)
    return (
      <div className="flex gap-3 py-1 px-3 hover:bg-deep-ocean/[0.02] rounded transition-colors">
        {/* Space for avatar alignment */}
        <div className="flex-shrink-0 w-10" />

        {/* Content with left padding */}
        <div className="flex-1 min-w-0">
          <div
            className={`text-sm leading-relaxed ${
              message.is_deleted
                ? 'italic text-driftwood/50'
                : 'text-deep-slate'
            }`}
          >
            {message.content || '(deleted)'}
          </div>
        </div>
      </div>
    )
  }
}
