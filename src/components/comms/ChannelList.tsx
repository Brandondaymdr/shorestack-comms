'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Badge from '@/components/ui/Badge'
import EntityBadge from '@/components/comms/EntityBadge'
import type { Workspace, ChannelWithUnread } from '@/types/comms'

interface WorkspaceGroup {
  workspace: Workspace
  channels: ChannelWithUnread[]
}

export default function ChannelList({
  workspaces,
}: {
  workspaces: WorkspaceGroup[]
}) {
  const pathname = usePathname()

  return (
    <div className="flex flex-col gap-6 px-3 py-4">
      {workspaces.map((group) => (
        <div key={group.workspace.id} className="flex flex-col gap-2">
          {/* Workspace Header */}
          <div className="px-3 py-2 flex items-center gap-2">
            <h3 className="font-mono text-xs uppercase tracking-widest text-shore-sand/70">
              {group.workspace.name}
            </h3>
            {group.workspace.entity_tag && (
              <EntityBadge tag={group.workspace.entity_tag} />
            )}
          </div>

          {/* Channels */}
          <div className="flex flex-col gap-1">
            {group.channels.map((channel) => {
              const isActive = pathname === `/comms/channel/${channel.id}`

              return (
                <Link
                  key={channel.id}
                  href={`/comms/channel/${channel.id}`}
                  className={`py-1 px-3 rounded text-sm font-mono transition-all ${
                    isActive
                      ? 'bg-white/10 text-shore-sand'
                      : 'text-shore-sand/60 hover:text-shore-sand/90 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2 justify-between">
                    <span>#{channel.name}</span>
                    {channel.unread_count > 0 && (
                      <Badge count={channel.unread_count} />
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
