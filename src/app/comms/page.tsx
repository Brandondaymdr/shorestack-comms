import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getWorkspacesWithChannels } from '@/lib/comms/channels'

export default async function CommsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const workspacesData = await getWorkspacesWithChannels(user.id)

  // Find first channel from first workspace
  if (workspacesData.length > 0 && workspacesData[0].channels.length > 0) {
    const firstChannelId = workspacesData[0].channels[0].id
    redirect(`/comms/channel/${firstChannelId}`)
  }

  // No channels found
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-deep-slate mb-2">No channels available</h2>
        <p className="text-driftwood">You haven't been added to any channels yet.</p>
      </div>
    </div>
  )
}
