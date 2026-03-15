import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getWorkspacesWithChannels } from '@/lib/comms/channels'
import ChannelList from '@/components/comms/ChannelList'

export default async function CommsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const workspacesData = await getWorkspacesWithChannels(user.id)

  return (
    <div className="flex h-screen bg-shore-sand">
      {/* Sidebar */}
      <div className="w-60 bg-deep-ocean flex flex-col border-r border-driftwood/20">
        {/* Header */}
        <div className="px-4 py-4 border-b border-driftwood/20">
          <div className="font-mono text-lg tracking-wider text-shore-sand">Shorestack</div>
          <div className="font-mono text-xs uppercase tracking-widest text-driftwood/60 mt-1">
            Comms
          </div>
        </div>

        {/* Channel List */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-driftwood/30 scrollbar-track-transparent">
          <ChannelList workspaces={workspacesData} />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {children}
      </div>
    </div>
  )
}
