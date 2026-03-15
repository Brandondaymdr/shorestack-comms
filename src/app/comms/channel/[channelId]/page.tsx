import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getChannel } from '@/lib/comms/channels'
import { getChannelMessages } from '@/lib/comms/messages.server'
import MessageFeed from '@/components/comms/MessageFeed'
import MessageInput from '@/components/comms/MessageInput'

export default async function ChannelPage({
  params,
}: {
  params: Promise<{ channelId: string }>
}) {
  const { channelId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const channel = await getChannel(channelId)

  if (!channel) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-deep-slate mb-2">Channel not found</h2>
        </div>
      </div>
    )
  }

  const initialMessages = await getChannelMessages(channelId)

  return (
    <>
      {/* Channel Header */}
      <div className="border-b border-driftwood/20 px-6 py-4">
        <h1 className="font-mono text-lg text-deep-slate">#{channel.name}</h1>
        {channel.description && (
          <p className="text-driftwood text-sm mt-1">{channel.description}</p>
        )}
      </div>

      {/* Message Feed */}
      <div className="flex-1 overflow-y-auto flex flex-col scrollbar-thin">
        <MessageFeed channelId={channelId} initialMessages={initialMessages} />
      </div>

      {/* Message Input */}
      <MessageInput channelId={channelId} channelName={channel.name} />
    </>
  )
}
